/**
 * @typedef {import('./types').CreateUser} createUser
 * @param {import('./types').User} user
 */
function createUser(user) {
  //return user
  return new Promise((resolve, reject) => {
    resolve(1123);
  });
}
createUser({ age: 123, name: 123 });
createUser();
