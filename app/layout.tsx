import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"Rota do Dólar · Tiago Gomes",description:"Descubra a proposta da Rota do Dólar com Tiago Gomes: agência com inteligência artificial e comissões em dólar.",robots:{index:false,follow:false},icons:{icon:"/tiago-gomes/favicon.svg",shortcut:"/tiago-gomes/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="pt-BR"><body>{children}</body></html>}
