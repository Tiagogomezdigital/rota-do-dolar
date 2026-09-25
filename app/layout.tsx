import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"Próximo Passo · Sua jornada começa aqui",description:"Uma experiência interativa para descobrir seu próximo passo. Versão de apresentação com conteúdo provisório.",robots:{index:false,follow:false},icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="pt-BR"><body>{children}</body></html>}
