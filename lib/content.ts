/** Separate copy editions so previously collected answers keep their original context. */
export const CONTENT_VERSION = 'rota-dolar-v3';
export const content = {
  brand: 'ROTA DO DÓLAR',
  preview: false,
  hero: {
    eyebrow: 'COM TIAGO GOMES',
    title: 'Uma nova rota para',
    highlight: 'ganhar em dólar.',
    description: 'Conheça uma agência com inteligência artificial e estrutura pronta. Seu papel: trazer empresas para se cadastrar. Em 8 perguntas, descubra o que observar nesse modelo de comissões em dólar.',
    cta: 'Quero conhecer essa rota',
    imageUrl: '/tiago-gomes/images/tiago-momentos-hero.png',
  },
  expert: {
    name: 'Tiago Gomes',
    description: 'No mercado digital, consegui construir a casa da minha mãe e dar mais conforto à minha família. Criei a Rota do Dólar para apresentar esse modelo a quem quer começar, mesmo sem experiência.',
    mechanism: 'A estrutura da agência já está pronta. Seu papel é trazer empresas para se cadastrar. Na apresentação, vou explicar a operação e as condições para receber comissões em dólar.',
    cta: 'Ver o que faz sentido para mim',
  },
  offer: {
    title: 'Conheça o modelo por trás da Rota do Dólar.',
    description: 'Na apresentação, Tiago Gomes explica como funciona a agência com IA, o que você faz na operação e como entram as comissões em dólar.',
    videoUrl: '', checkoutUrl: '',
    cta: 'Registrar meu interesse',
    checkoutCta: 'Ver condições de acesso',
  },
};
export type Option = {id:string;label:string;icon:string;description?:string};
export type Question = {id:string;title:string;label:string;description:string;options:Option[]};
const option = (id:string,label:string,icon:string,description?:string):Option => ({id,label,icon,description});
export const questions:Question[] = [
  {id:'momento',label:'Sua realidade',title:'Qual situação mais combina com você hoje?',description:'Escolha a mais próxima da sua realidade.',options:[option('clt','Tenho um emprego e quero uma renda extra','briefcase'),option('autonomo','Trabalho por conta e quero aumentar minha renda','chart'),option('sem-renda','Estou sem renda e buscando uma oportunidade','search'),option('digital','Já ganho dinheiro no digital e quero diversificar','compass')]},
  {id:'experiencia',label:'Sua experiência',title:'Você já tentou ganhar dinheiro pela internet?',description:'Seu ponto de partida ajuda a direcionar a apresentação.',options:[option('primeira','Nunca tentei. Seria meu primeiro passo','sprout'),option('tentativa','Já tentei, mas não consegui o resultado que buscava','repeat'),option('aprendendo','Estou estudando e ainda tenho dúvidas para começar','book'),option('pratica','Já tenho experiência e quero conhecer outro modelo','chart')]},
  {id:'motivacao',label:'O que você quer mudar',title:'O que uma renda extra ajudaria a resolver primeiro?',description:'Pense no que faria diferença na sua vida hoje.',options:[option('contas','Pagar as contas com mais tranquilidade','shield'),option('familia','Dar mais conforto à minha família','heart'),option('liberdade','Depender menos de uma única fonte de renda','compass'),option('projeto','Realizar um plano que venho adiando','flag')]},
  {id:'obstaculo',label:'Sua principal dúvida',title:'O que você precisa entender para dar o próximo passo?',description:'Escolha o ponto que mais pesa na sua decisão.',options:[option('direcao','O que eu teria que fazer na prática','compass'),option('seguranca','Os custos e as condições para receber comissões','shield'),option('tecnologia','Se consigo usar a tecnologia mesmo sendo iniciante','book'),option('tempo','Se as tarefas cabem no tempo que tenho','clock')]},
  {id:'exposicao',label:'Sem gravar vídeos',title:'Como você se sente em aparecer em vídeos?',description:'O modelo apresentado por Tiago não exige que você grave vídeos.',options:[option('privacidade','Prefiro trabalhar sem expor minha imagem','lock'),option('inseguro','Tenho vergonha ou insegurança de aparecer','user'),option('indiferente','Aparecer não seria um problema para mim','check')]},
  {id:'ia',label:'Sua familiaridade com IA',title:'Como é sua experiência com ferramentas de inteligência artificial?',description:'Não precisa ter experiência para conhecer a proposta.',options:[option('zero','Conheço pouco e nunca usei','sprout'),option('curioso','Conheço algumas, mas ainda não sei usar','search'),option('ocasional','Já usei algumas vezes','zap'),option('rotina','Uso na minha rotina de trabalho ou estudos','book')]},
  {id:'estrutura',label:'O que você tem hoje',title:'Qual equipamento você tem disponível?',description:'Na apresentação, Tiago vai mostrar como a operação funciona pelo celular.',options:[option('celular','Celular com internet','phone'),option('computador','Computador com internet','monitor'),option('ambos','Celular e computador com internet','check')]},
  {id:'tempo',label:'Seu tempo disponível',title:'Quanto tempo você pode reservar por dia para aprender e aplicar?',description:'Escolha um tempo que você realmente consiga manter.',options:[option('15-30','De 15 a 30 minutos','clock'),option('30-60','De 30 minutos a 1 hora','clock'),option('1-2h','De 1 a 2 horas','clock'),option('2h+','Mais de 2 horas','clock')]},
];
export const PROCESS_STEP = questions.length+1;
export const STORY_STEP = questions.length+2;
export const RESULT_STEP = questions.length+3;
export const OFFER_STEP = questions.length+4;
export const stepNames = ['Abertura',...questions.map(q=>q.label),'Resumo das respostas','Tiago Gomes','Orientação para o vídeo','Apresentação'];
export function getSuggestion(answers:Record<string,string>) {
  const experiences:Record<string,{title:string;text:string}> = {
    primeira: {title:'Seu primeiro passo é entender a operação.',text:'Você está começando do zero. No vídeo, veja como a estrutura pronta funciona, como trazer empresas para se cadastrar e o que acontece depois do cadastro.'},
    tentativa: {title:'Sua próxima decisão pode ser mais informada.',text:'Você já tentou ganhar dinheiro pela internet. Desta vez, procure entender o que você fará no dia a dia e o que precisa acontecer para uma comissão ser aprovada.'},
    aprendendo: {title:'Veja como a proposta funciona na prática.',text:'Você já está estudando. Use a apresentação para ligar o que aprendeu às tarefas da agência e identificar as dúvidas que ainda precisa resolver.'},
    pratica: {title:'Um novo modelo para comparar com o que você já faz.',text:'Você já tem experiência. Observe o funcionamento da agência, a captação de empresas e as condições de comissão para avaliar essa alternativa.'},
  };
  const priorities:Record<string,string> = {
    direcao:'Veja como trazer empresas para a agência, o que você faz após um cadastro e quais etapas precisa executar.',
    seguranca:'Confira os custos de entrada, os critérios de aprovação dos cadastros e as condições de pagamento das comissões.',
    tecnologia:'Observe quais ferramentas são usadas e como a estrutura pronta funciona, mesmo para quem ainda está aprendendo a usar IA.',
    tempo:'Compare as tarefas apresentadas com o tempo diário que você consegue reservar para aprender e aplicar.',
  };
  const motivations:Record<string,string> = {
    contas:'Mais tranquilidade para pagar as contas',familia:'Mais conforto para sua família',
    liberdade:'Menos dependência de uma única renda',projeto:'Realizar um plano que você vem adiando',
  };
  const contexts:Record<string,string> = {
    clt:'Você busca uma renda extra junto do seu emprego. Observe como as tarefas podem se encaixar na sua rotina atual.',
    autonomo:'Você já trabalha por conta. Compare as tarefas da agência com os compromissos e a renda que tem hoje.',
    'sem-renda':'Você busca uma fonte de renda. Antes de começar, confira os custos e o trabalho necessário para operar a agência.',
    digital:'Você já ganha dinheiro no digital. Compare esse modelo com o que já faz e avalie o que mudaria na sua operação.',
  };
  const device=answers.estrutura==='celular'?'Celular com internet':answers.estrutura==='computador'?'Computador com internet':'Celular e computador';
  const time=questions.find(q=>q.id==='tempo')?.options.find(o=>o.id===answers.tempo)?.label||'Seu tempo disponível';
  return {
    ...(experiences[answers.experiencia]||experiences.primeira),
    priority:priorities[answers.obstaculo]||priorities.direcao,
    goal:motivations[answers.motivacao]||'Uma nova fonte de renda',
    context:contexts[answers.momento]||contexts.clt, device,time,
    ai:answers.ia==='zero'||answers.ia==='curioso'?'Como a IA entra na operação':'Como aproveitar sua experiência com IA',
    privacy:answers.exposicao==='inseguro'?'O modelo não exige que você grave vídeos.':answers.exposicao==='privacidade'?'Veja como trabalhar sem expor sua imagem.':'Gravar vídeos não faz parte da exigência do modelo.',
  };
}
