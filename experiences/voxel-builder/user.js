import evt from './evt';

export async function initCurrentUser() {
  if (window.localStorage.appUserKey) {
    return new evt.User(localStorage.appUserKey);
  } else {
    const user = await evt.app.appUser().create({
      anonymous: true
    });

    window.localStorage.appUserKey = user.apiKey;

    return user;
  }
}