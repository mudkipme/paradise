import fetch from 'node-fetch';

export type GitHubUser = {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
};

export type ProviderUser = {
  provider: 'github',
  id: number;
  name: string;
  user: GitHubUser;
};

export const getGitHubUser = async (token: string) => {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      authorization: `token ${token}`,
    },
  });
  if (response.status >= 300 || response.status < 200) {
    throw new Error(await response.text());
  }
  const json = await response.json() as GitHubUser;
  return json;
};

export const a = 5;
