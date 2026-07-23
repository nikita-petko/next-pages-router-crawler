import{_ as T}from"./objectWithoutPropertiesLoose-Dsqj8S3w.js";import{_ as i}from"./extends-BAwxZeKA.js";import*as j from"react";import{P as e}from"./index-B07d39WI.js";import{c as U}from"./clsx-B-dksMZM.js";import{c as z,s as g}from"./styled-s0UylUWF.js";import{g as E,b as l}from"./createTheme-DcSDGmoA.js";import{g as I}from"./generateUtilityClasses-n6k0wyPA.js";import{jsx as y}from"react/jsx-runtime";import{u as F}from"./DefaultPropsProvider-CxFtQxv9.js";import{c as K}from"./chainPropTypes--WN1XLK8.js";import{css as P,keyframes as S}from"@emotion/react";function V(r){return E("MuiCircularProgress",r)}const W=I("MuiCircularProgress",["root","determinate","indeterminate","colorPrimary","colorSecondary","svg","circle","circleDeterminate","circleIndeterminate","circleDisableShrink"]),B=["className","color","disableShrink","size","style","thickness","value","variant"];let m=r=>r,D,_,$,w;const o=44,G=S(D||(D=m`
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
`)),L=S(_||(_=m`
  0% {
    stroke-dasharray: 1px, 200px;
    stroke-dashoffset: 0;
  }

  50% {
    stroke-dasharray: 100px, 200px;
    stroke-dashoffset: -15px;
  }

  100% {
    stroke-dasharray: 100px, 200px;
    stroke-dashoffset: -125px;
  }
`)),Y=r=>{const{classes:s,variant:t,color:a,disableShrink:f}=r,d={root:["root",t,`color${l(a)}`],svg:["svg"],circle:["circle",`circle${l(t)}`,f&&"circleDisableShrink"]};return z(d,V,s)},Z=g("span",{name:"MuiCircularProgress",slot:"Root",overridesResolver:(r,s)=>{const{ownerState:t}=r;return[s.root,s[t.variant],s[`color${l(t.color)}`]]}})(({ownerState:r,theme:s})=>i({display:"inline-block"},r.variant==="determinate"&&{transition:s.transitions.create("transform")},r.color!=="inherit"&&{color:(s.vars||s).palette[r.color].main}),({ownerState:r})=>r.variant==="indeterminate"&&P($||($=m`
      animation: ${0} 1.4s linear infinite;
    `),G)),q=g("svg",{name:"MuiCircularProgress",slot:"Svg",overridesResolver:(r,s)=>s.svg})({display:"block"}),A=g("circle",{name:"MuiCircularProgress",slot:"Circle",overridesResolver:(r,s)=>{const{ownerState:t}=r;return[s.circle,s[`circle${l(t.variant)}`],t.disableShrink&&s.circleDisableShrink]}})(({ownerState:r,theme:s})=>i({stroke:"currentColor"},r.variant==="determinate"&&{transition:s.transitions.create("stroke-dashoffset")},r.variant==="indeterminate"&&{strokeDasharray:"80px, 200px",strokeDashoffset:0}),({ownerState:r})=>r.variant==="indeterminate"&&!r.disableShrink&&P(w||(w=m`
      animation: ${0} 1.4s ease-in-out infinite;
    `),L)),M=j.forwardRef(function(s,t){const a=F({props:s,name:"MuiCircularProgress"}),{className:f,color:d="primary",disableShrink:N=!1,size:p=40,style:O,thickness:n=3.6,value:u=0,variant:k="indeterminate"}=a,R=T(a,B),c=i({},a,{color:d,disableShrink:N,size:p,thickness:n,value:u,variant:k}),h=Y(c),v={},b={},C={};if(k==="determinate"){const x=2*Math.PI*((o-n)/2);v.strokeDasharray=x.toFixed(3),C["aria-valuenow"]=Math.round(u),v.strokeDashoffset=`${((100-u)/100*x).toFixed(3)}px`,b.transform="rotate(-90deg)"}return y(Z,i({className:U(h.root,f),style:i({width:p,height:p},b,O),ownerState:c,ref:t,role:"progressbar"},C,R,{children:y(q,{className:h.svg,ownerState:c,viewBox:`${o/2} ${o/2} ${o} ${o}`,children:y(A,{className:h.circle,style:v,ownerState:c,cx:o,cy:o,r:(o-n)/2,fill:"none",strokeWidth:n})})}))});process.env.NODE_ENV!=="production"&&(M.propTypes={classes:e.object,className:e.string,color:e.oneOfType([e.oneOf(["inherit","primary","secondary","error","info","success","warning"]),e.string]),disableShrink:K(e.bool,r=>r.disableShrink&&r.variant&&r.variant!=="indeterminate"?new Error("MUI: You have provided the `disableShrink` prop with a variant other than `indeterminate`. This will have no effect."):null),size:e.oneOfType([e.number,e.string]),style:e.object,sx:e.oneOfType([e.arrayOf(e.oneOfType([e.func,e.object,e.bool])),e.func,e.object]),thickness:e.number,value:e.number,variant:e.oneOf(["determinate","indeterminate"])});export{M as C,W as c};
