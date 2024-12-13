import{r as h,j as e,H as y,L as c}from"./index-DvujZN1e.js";import{f as N,a as d,b as m,c as b,F as s,d as u,e as j,g as v,h as w,i as f,j as k,k as S,l as T}from"./index.es-bT6xLkJU.js";const o=({title:t,children:r,id:l})=>e.jsxs("section",{id:l,className:"space-y-4 rounded-lg border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-lg",children:[e.jsx("h2",{className:"text-2xl font-bold text-gray-900",children:t}),r]}),L=()=>{const t=h.useMemo(()=>[{title:"Tải File Lên",icon:N,id:"tải-file-lên"},{title:"Quét Lỗ Hổng",icon:d,id:"quét-lỗ-hổng"},{title:"Phân Tích AI",icon:m,id:"phân-tích-ai"},{title:"Xem Kết Quả",icon:b,id:"xem-kết-quả"}],[]),[r,l]=h.useState(t[0].id);return h.useEffect(()=>{const i=()=>{const a=window.innerHeight/2,g=t.map(n=>({id:n.id,element:document.getElementById(n.id)})).find(({element:n})=>{if(!n)return!1;const p=n.getBoundingClientRect();return p.top<=a&&p.bottom>=a});g?l(g.id):window.innerHeight+window.scrollY>=document.documentElement.scrollHeight&&l(t[t.length-1].id)};return window.addEventListener("scroll",i),i(),()=>window.removeEventListener("scroll",i)},[t]),e.jsxs(e.Fragment,{children:[e.jsx(y,{children:e.jsx("title",{children:"FPT UniSAST"})}),e.jsx("div",{className:"min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-white px-8 py-12",children:e.jsxs("div",{className:"mx-auto max-w-7xl",children:[e.jsxs("h1",{className:"mb-12 text-center text-4xl font-bold text-gray-900",children:["FPT UniSAST"," ",e.jsx("span",{className:"mt-2 block text-2xl font-semibold text-gray-700",children:"Nền Tảng Phân Tích Bảo Mật Thông Minh"}),e.jsx("span",{className:"mt-3 block text-lg font-normal text-gray-600",children:"Tự động hóa việc phát hiện và phân tích lỗ hổng bảo mật với công nghệ tiên tiến"})]}),e.jsxs("div",{className:"mb-12 flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm",children:[e.jsxs("p",{className:"max-w-3xl text-center text-lg text-gray-700",children:[e.jsx("span",{className:"font-semibold",children:"FPT UniSAST"})," ","là giải pháp phân tích bảo mật tích hợp, kết hợp sức mạnh của"," ",e.jsx("a",{target:"_blank",href:"https://github.com/semgrep/semgrep",title:"Semgrep",className:"font-medium",children:"Semgrep"})," ","và"," ",e.jsx("a",{target:"_blank",href:"https://github.com/Bearer/bearer",title:"Bearer",className:"font-medium",children:"Bearer"})," ","với khả năng phân tích thông minh của"," ",e.jsx("span",{title:"AI",className:"font-medium",children:"AI"})," ","để bảo vệ mã nguồn của bạn"]}),e.jsxs("div",{className:"mt-8 flex justify-center gap-4",children:[e.jsx(c,{to:"/scan",className:"group relative rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition-all duration-200 hover:bg-gray-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",children:e.jsxs("span",{className:"relative z-10 inline-flex items-center gap-2",children:["Bắt Đầu Quét",e.jsx(s,{icon:u,className:"transition-transform duration-200 group-hover:translate-x-0.5"})]})}),e.jsx(c,{to:"/history",className:"group rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",children:e.jsx("span",{className:"relative z-10",children:"Xem Lịch Sử"})})]})]}),e.jsxs("div",{className:"grid grid-cols-[300px_1fr] gap-8",children:[e.jsxs("div",{className:"sticky top-20 h-fit select-none space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm",children:[e.jsx("h3",{className:"font-semibold text-gray-900",children:"Nội Dung Chính"}),e.jsx("nav",{className:"space-y-2",children:t.map(({title:i,icon:x,id:a})=>e.jsxs("a",{href:`#${a}`,className:`flex items-center gap-2 rounded-lg px-4 py-2 transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 ${r===a?"bg-gray-100 text-gray-900 shadow-sm":"text-gray-600"}`,children:[e.jsx(s,{icon:x,className:`h-4 w-4 ${r===a?"text-gray-900":"text-gray-400"}`}),i]},a))})]}),e.jsxs("div",{className:"space-y-8",children:[e.jsx(o,{title:"Bước 1: Tải File Lên",id:"tải-file-lên",children:e.jsxs("div",{className:"space-y-4",children:[e.jsx("p",{className:"text-lg text-gray-800",children:e.jsx("span",{className:"font-semibold",children:"Quy trình tải file:"})}),e.jsxs("div",{className:"grid grid-cols-2 gap-6",children:[e.jsxs("ul",{className:"space-y-3 text-gray-700",children:[e.jsxs("li",{className:"flex items-start gap-2",children:[e.jsx(s,{icon:j,className:"mt-1 h-4 w-4 text-gray-400"}),e.jsxs("span",{children:[e.jsx("span",{className:"font-medium",children:"Chọn file ZIP"})," ","bằng cách nhấp vào"," ",e.jsx(c,{to:"/scan",className:"inline-block rounded-md bg-gray-100 px-2 py-1 font-medium transition-all duration-200 hover:bg-gray-200 hover:text-gray-900 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1",children:"Chọn File"})," ","hoặc kéo thả"]})]}),e.jsxs("li",{className:"flex items-start gap-2",children:[e.jsx(s,{icon:d,className:"mt-1 h-4 w-4 text-gray-400"}),e.jsxs("span",{children:["Hỗ trợ tối đa"," ",e.jsx("span",{className:"font-medium",children:"50MB"})," ","cho mỗi file ZIP"]})]})]}),e.jsxs("div",{className:"rounded-lg bg-gray-50 p-4 transition-all duration-200 hover:bg-gray-100 hover:shadow-md",children:[e.jsx("p",{className:"font-medium text-gray-800",children:"Định dạng hỗ trợ:"}),e.jsxs("ul",{className:"mt-2 space-y-1 text-gray-600",children:[e.jsx("li",{children:"• File nén ZIP"}),e.jsx("li",{children:"• Chứa các file .java, .cpp, .py"})]})]})]})]})}),e.jsx(o,{title:"Bước 2: Quét Lỗ Hổng",id:"quét-lỗ-hổng",children:e.jsx("div",{className:"space-y-6",children:e.jsxs("div",{className:"grid grid-cols-2 gap-6",children:[e.jsxs("div",{className:"space-y-3",children:[e.jsx("p",{className:"text-lg font-medium text-gray-800",children:"Quy trình quét tự động:"}),e.jsxs("ul",{className:"space-y-3 text-gray-700",children:[e.jsxs("li",{className:"flex items-start gap-2",children:[e.jsx(s,{icon:d,className:"mt-1 h-4 w-4 text-gray-400"}),e.jsxs("span",{children:[e.jsx("span",{className:"font-medium",children:"Semgrep"})," ","quét mã nguồn để phát hiện các lỗ hổng bảo mật"]})]}),e.jsxs("li",{className:"flex items-start gap-2",children:[e.jsx(s,{icon:v,className:"mt-1 h-4 w-4 text-gray-400"}),e.jsxs("span",{children:[e.jsx("span",{className:"font-medium",children:"Bearer"})," ","phân tích các vấn đề về bảo mật dữ liệu"]})]}),e.jsxs("li",{className:"flex items-start gap-2",children:[e.jsx(s,{icon:m,className:"mt-1 h-4 w-4 text-gray-400"}),e.jsxs("span",{children:[e.jsx("span",{className:"font-medium",children:"AI (tùy chọn)"})," ","phân tích sâu và đề xuất cách khắc phục"]})]})]})]}),e.jsxs("div",{className:"rounded-lg bg-amber-50 p-4 transition-all duration-200 hover:bg-amber-100 hover:shadow-md",children:[e.jsx("p",{className:"font-medium text-amber-800",children:"Thời gian quét:"}),e.jsxs("ul",{className:"mt-2 space-y-1 text-amber-700",children:[e.jsx("li",{children:"• File nhỏ: 30 giây - 1 phút"}),e.jsx("li",{children:"• File trung bình: 1-3 phút"}),e.jsx("li",{children:"• File lớn: 3-5 phút"})]})]})]})})}),e.jsx(o,{title:"Bước 3: Phân Tích AI",id:"phân-tích-ai",children:e.jsxs("div",{className:"space-y-4",children:[e.jsx("p",{className:"text-lg text-gray-800",children:e.jsx("span",{className:"font-semibold",children:"Phân tích bảo mật:"})}),e.jsxs("div",{className:"grid grid-cols-2 gap-6",children:[e.jsxs("ul",{className:"space-y-3 text-gray-700",children:[e.jsxs("li",{className:"flex items-start gap-2",children:[e.jsx(s,{icon:w,className:"mt-1 h-4 w-4 text-gray-400"}),e.jsx("span",{children:"Phát hiện các lỗ hổng bảo mật nghiêm trọng"})]}),e.jsxs("li",{className:"flex items-start gap-2",children:[e.jsx(s,{icon:f,className:"mt-1 h-4 w-4 text-gray-400"}),e.jsx("span",{children:"Cảnh báo về các rủi ro bảo mật tiềm ẩn"})]}),e.jsxs("li",{className:"flex items-start gap-2",children:[e.jsx(s,{icon:k,className:"mt-1 h-4 w-4 text-gray-400"}),e.jsx("span",{children:"Đề xuất biện pháp khắc phục cụ thể"})]})]}),e.jsxs("div",{className:"rounded-lg bg-gray-50 p-4 transition-all duration-200 hover:bg-gray-100 hover:shadow-md",children:[e.jsx("p",{className:"font-medium text-gray-800",children:"So sánh mã nguồn:"}),e.jsxs("ul",{className:"mt-2 space-y-1 text-gray-600",children:[e.jsx("li",{children:"• Hiển thị vị trí lỗ hổng"}),e.jsx("li",{children:"• So sánh code trước và sau khi sửa"}),e.jsx("li",{children:"• Giải thích chi tiết cách khắc phục"})]})]})]})]})}),e.jsx(o,{title:"Bước 4: Xem Kết Quả",id:"xem-kết-quả",children:e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"grid grid-cols-2 gap-6",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-lg font-medium text-gray-800",children:"Kết quả bao gồm:"}),e.jsxs("ul",{className:"mt-3 space-y-3 text-gray-700",children:[e.jsxs("li",{className:"flex items-start gap-2",children:[e.jsx(s,{icon:S,className:"mt-1 h-4 w-4 text-gray-400"}),e.jsx("span",{children:"Báo cáo chi tiết về chất lượng mã nguồn"})]}),e.jsxs("li",{className:"flex items-start gap-2",children:[e.jsx(s,{icon:m,className:"mt-1 h-4 w-4 text-gray-400"}),e.jsx("span",{children:"Đề xuất cải thiện từ AI"})]}),e.jsxs("li",{className:"flex items-start gap-2",children:[e.jsx(s,{icon:j,className:"mt-1 h-4 w-4 text-gray-400"}),e.jsx("span",{children:"Mã nguồn đã được tối ưu"})]})]}),e.jsxs(c,{to:"/history",className:"group mt-6 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",children:[e.jsx(s,{icon:T,className:"h-4 w-4"}),"Xem Lịch Sử Quét",e.jsx(s,{icon:u,className:"transition-transform duration-200 group-hover:translate-x-0.5"})]})]}),e.jsxs("div",{className:"rounded-lg bg-green-50 p-4 transition-all duration-200 hover:bg-green-100 hover:shadow-md",children:[e.jsx("p",{className:"font-medium text-green-800",children:"Xuất báo cáo:"}),e.jsx("ul",{className:"mt-2 space-y-1 text-green-700",children:e.jsx("li",{children:"• JSON - cho phân tích kỹ thuật"})})]})]}),e.jsxs("div",{className:"mt-6 rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-4 transition-all duration-200 hover:bg-yellow-100 hover:shadow-md",children:[e.jsxs("p",{className:"flex items-center gap-2 font-bold text-yellow-800",children:[e.jsx(s,{icon:f,className:"h-5 w-5"}),"Lưu ý về độ chính xác:"]}),e.jsx("p",{className:"mt-2 text-yellow-700",children:"Mặc dù sử dụng mô hình AI tiên tiến, các đề xuất có thể cần được xem xét trong ngữ cảnh cụ thể của dự án. Hãy kiểm tra kỹ các đề xuất trước khi áp dụng để đảm bảo tính phù hợp với yêu cầu của bạn."})]})]})})]})]}),e.jsx("footer",{className:"mt-12 text-center text-sm text-gray-600",children:e.jsxs("p",{children:["© ",new Date().getFullYear()," FPT UniSAST."]})})]})})]})};export{L as default};
