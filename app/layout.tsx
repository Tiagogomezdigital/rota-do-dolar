import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"Rota do Dólar · Tiago Gomez",description:"Conheça a Rota do Dólar com IA. Responda ao questionário e descubra o passo a passo apresentado por Tiago Gomez.",robots:{index:false,follow:false},icons:{icon:"/tiago-gomes/favicon.svg",shortcut:"/tiago-gomes/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="pt-BR"><head><script id="vturb-performance" dangerouslySetInnerHTML={{__html:'!function(i,n){i._plt=i._plt||(n&&n.timeOrigin?n.timeOrigin+n.now():Date.now())}(window,performance);'}}/></head><body>{children}</body></html>}
