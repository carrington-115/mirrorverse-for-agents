// Chunked lint-staged config — splits staged filenames into batches of 25 so
// the generated command line stays under Windows' 8 191-character limit.
const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

module.exports = {
  "*.{ts,tsx,js,jsx,mjs,cjs}": (files) => [
    ...chunk(files, 25).map((f) => `prettier --write ${f.join(" ")}`),
    ...chunk(files, 25).map(
      (f) => `eslint --fix --max-warnings 0 --no-warn-ignored ${f.join(" ")}`,
    ),
  ],
  "*.{json,md,css,yaml,yml}": (files) =>
    chunk(files, 25).map((f) => `prettier --write ${f.join(" ")}`),
};
