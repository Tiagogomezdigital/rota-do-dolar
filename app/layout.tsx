import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"Rota do Dólar · Tiago Gomes",description:"Conheça a agência com IA e estrutura pronta da Rota do Dólar. Responda 8 perguntas e descubra o que observar no modelo apresentado por Tiago Gomes.",robots:{index:false,follow:false},icons:{icon:"/tiago-gomes/favicon.svg",shortcut:"/tiago-gomes/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="pt-BR"><body>{children}</body></html>}
