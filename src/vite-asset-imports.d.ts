// Vite query-suffix asset imports
declare module "*?arraybuffer" {
  const value: ArrayBuffer;
  export default value;
}
