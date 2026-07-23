import*as o from"react";function e(n,t){typeof n=="function"?n(t):n&&(n.current=t)}function r(...n){return o.useMemo(()=>n.every(t=>t==null)?null:t=>{n.forEach(u=>{e(u,t)})},n)}export{e as s,r as u};
