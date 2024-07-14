const GH_BASE_URL = 'https://api.github.com';
const GH_USER_API = `${GH_BASE_URL}/user`;
const GH_OAUTH_URI = 'https://github.com/login/oauth/authorize';
const GH_ACCESS_TOKEN_URI = 'https://github.com/login/oauth/access_token';
const GH_SUCCESS_REDIRECT_PATH = '/account/github/profile/';
const GH_ERR_REDIRECT_PATH = '/account/github';

const CODEBERG_URI = `https://codeberg.org`;
const CODEBERG_SUCCESS_REDIRECT_PATH = '/account/codeberg/profile/';
const CODEBERG_ERR_REDIRECT_PATH = '/account/codeberg';

const CODEBERG_USER_API = `${CODEBERG_URI}/api/v1/users`;

export {
	GH_BASE_URL,
	GH_USER_API,
	GH_ERR_REDIRECT_PATH,
	GH_OAUTH_URI,
	GH_ACCESS_TOKEN_URI,
	GH_SUCCESS_REDIRECT_PATH,
	CODEBERG_URI,
	CODEBERG_SUCCESS_REDIRECT_PATH,
	CODEBERG_ERR_REDIRECT_PATH,
	CODEBERG_USER_API
};
