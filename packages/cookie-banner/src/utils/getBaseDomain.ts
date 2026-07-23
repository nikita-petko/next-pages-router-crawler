export default function getBaseDomain() {
  const parts = window.location.hostname.split(".");
  if (parts.length <= 2) return window.location.hostname;
  // Return the domain one-level up
  return `.${parts.slice(1).join(".")}`;
}
