import type {Metadata} from 'next';
import type {ReactNode} from 'react';

export const metadata:Metadata={
  title:'Rota do Dólar · Tiago Gomez',
  description:'Conheça a Rota do Dólar com IA. Responda ao questionário e descubra o passo a passo apresentado por Tiago Gomez.',
  robots:{index:false,follow:false},
  icons:{icon:'/daniel/favicon.svg',shortcut:'/daniel/favicon.svg'},
};

export default function DanielLayout({children}:{children:ReactNode}){return children;}
