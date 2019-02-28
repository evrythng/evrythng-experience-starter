export function parse() {
  return window.location.search.split('?')
    .pop()
    .split('&')
    .reduce(
      (acc, part) => {
        const [name, value] = part.split('=');

        if (name && value) {
          acc[name] = value;
        }

        return acc;
      },
      {}
    );
}