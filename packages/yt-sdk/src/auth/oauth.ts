export interface TokenSet {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";

export class OAuth2Manager {
  /**
   * Build the Google OAuth2 authorization URL.
   */
  getAuthUrl(
    scopes: string[],
    redirectUri: string,
    clientId: string,
  ): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scopes.join(" "),
      access_type: "offline",
      prompt: "consent",
    });
    return `${AUTH_ENDPOINT}?${params.toString()}`;
  }

  /**
   * Exchange an authorization code for a token set.
   */
  async exchangeCode(
    code: string,
    config: OAuthConfig,
  ): Promise<TokenSet> {
    const res = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Token exchange failed (${res.status}): ${body}`);
    }

    return res.json() as Promise<TokenSet>;
  }

  /**
   * Refresh an expired access token.
   */
  async refreshToken(
    refreshToken: string,
    config: Pick<OAuthConfig, "clientId" | "clientSecret">,
  ): Promise<TokenSet> {
    const res = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Token refresh failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as Partial<TokenSet>;
    return {
      access_token: data.access_token ?? "",
      refresh_token: data.refresh_token ?? refreshToken,
      expires_in: data.expires_in ?? 3600,
      token_type: data.token_type ?? "Bearer",
    };
  }

  /**
   * Check whether a token has expired (with 60-second buffer).
   */
  isTokenExpired(expiresAt: number): boolean {
    return Date.now() >= expiresAt - 60_000;
  }
}
