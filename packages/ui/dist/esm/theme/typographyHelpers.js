function o(n){return n.split("").map((e,r)=>e.toUpperCase()===e?`${r!==0?"-":""}${e.toLowerCase()}`:e).join("")}function a(n){return n.reduce((e,r)=>`${e}@font-face {
    ${Object.keys(r).map(t=>`${o(t)}: ${r[t]};`).join(`
`)}
}
`,"")}function i(n){return`body {
  ${Object.keys(n).map(e=>`${o(e)}: ${n[e]};`).join(`
`)}
}
`}function c(...n){return n.reduce((e,r)=>`${e}${r}`,"")}export{i as bodyOverride,o as camelCaseToKebabCase,c as joinStringOverrides,a as parseFontFaces};
