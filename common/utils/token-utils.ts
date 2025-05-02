import jwtDecode from "jwt-decode";

class TokenUtils {
  /**
   * Decodes the String representation of JWT to json
   * @param token @type {String} String representation of JWT.
   * @return decoded token in json format or undefined
   */
  static decodeToken(
    token: string
  ): (Record<string, string> & { exp: number; nbf: number; iat: number; id: string }) | undefined {
    try {
      return jwtDecode(token);
    } catch (e) {
      return undefined;
    }
  }

  /**
   * Validates that JWT token was issued in the past and hasn't expired yet.
   * @param token @type {String} String representation of JWT
   * @param leeway
   * @return if JWT token has expired or not
   */
  static isTokenExpired(token?: string, leeway = 1.01): boolean {
    // TODO: remove this mock validation, once actual login api implemented
    if (token === "mock_access_token" || token === "mock_refresh_token") {
      return false;
    }

    if (!token) {
      return true;
    }

    const decoded = TokenUtils.decodeToken(token);
    if (!decoded) {
      return true;
    }

    const todayTime = Math.floor(new Date().getTime() / 1000) * 1000; // truncate millis
    const futureToday = new Date(todayTime + leeway * 1000);
    const pastToday = new Date(todayTime - leeway * 1000);

    const expValid = decoded.exp === null || !(pastToday > new Date(decoded.exp * 1000));
    const iatValid = decoded.nbf === null || !(futureToday < new Date(decoded.nbf * 1000));

    return !iatValid || !expValid;
  }
}

export { TokenUtils };
