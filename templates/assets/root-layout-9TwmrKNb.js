import{j as e,N as c,r,H as l,O as x}from"./index-lW-lZBXM.js";import{F as n,r as d,a as m,h,s as f,t as p}from"./index.es-ClVZX2lA.js";import{I as j}from"./index-BY-qhJqi.js";const g="/assets/logo-1tvLnijQ.png",u=[{to:"/",icon:m,label:"Trang chủ"},{to:"/scan",icon:h,label:"Quét files"},{to:"/history",icon:f,label:"Xem lịch sử báo cáo"}],y=()=>e.jsx("header",{className:"sticky top-0 z-50 bg-white/90 shadow backdrop-blur-sm",children:e.jsx("nav",{className:"container mx-auto px-4 py-4",children:e.jsxs("ul",{className:"flex gap-4",children:[u.map(({to:s,icon:a,label:t})=>e.jsx("li",{children:e.jsxs(c,{to:s,className:({isActive:o})=>`flex items-center gap-2 ${o?"font-medium text-gray-900":"text-gray-600 hover:text-gray-800"}`,children:[e.jsx(n,{icon:a}),e.jsx("span",{children:t})]})},s)),e.jsx("li",{children:e.jsxs("a",{href:"/docs",target:"_blank",rel:"noopener noreferrer",className:"flex items-center gap-2 text-gray-600 hover:text-gray-800",children:[e.jsx(n,{icon:d}),e.jsx("span",{children:"API Docs"})]})})]})})}),i=1024,w=()=>{const[s,a]=r.useState(window.innerWidth<i);return r.useEffect(()=>{const t=()=>{a(window.innerWidth<i)};return window.addEventListener("resize",t),()=>{window.removeEventListener("resize",t)}},[]),e.jsxs("div",{className:"min-h-screen",children:[e.jsx(l,{children:e.jsx("link",{rel:"shortcut icon",href:g,type:"image/png"})}),e.jsx(j,{position:"top-center",toastOptions:{duration:4e3,success:{iconTheme:{primary:"#10B981",secondary:"#ffffff"}},error:{iconTheme:{primary:"#EF4444",secondary:"#ffffff"}},style:{background:"#ffffff",color:"#1F2937",padding:"16px",borderRadius:"8px",boxShadow:"0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"}}}),s?e.jsxs("div",{className:"fixed inset-0 z-50 flex animate-fade-in flex-col items-center justify-center bg-white p-4 text-center",children:[e.jsx("div",{className:"mb-6",children:e.jsx("div",{className:"mx-auto h-24 w-24 animate-bounce text-[5rem] text-pink-500",children:e.jsx(n,{icon:p})})}),e.jsx("h2",{className:"mb-2 text-2xl font-bold text-gray-800",children:"(｡•́︿•̀｡)"}),e.jsx("p",{className:"mb-4 text-gray-600",children:"Vui lòng sử dụng thiết bị có độ phân giải lớn hơn để có trải nghiệm tốt nhất."}),e.jsx("p",{className:"text-sm text-gray-500",children:"⊂(◉‿◉)つ"})]}):e.jsxs(e.Fragment,{children:[e.jsx(y,{}),e.jsx("main",{className:"container mx-auto px-4 py-8",children:e.jsx(x,{})})]})]})};export{w as default};