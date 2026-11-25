from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

root = Path(__file__).resolve().parents[1]
out = root / "output/pdf/sniply-interview-guide.pdf"
out.parent.mkdir(parents=True, exist_ok=True)
font = Path("C:/Windows/Fonts/arial.ttf")
bold = Path("C:/Windows/Fonts/arialbd.ttf")
if font.exists():
    pdfmetrics.registerFont(TTFont("Body", str(font)))
    pdfmetrics.registerFont(TTFont("BodyBold", str(bold)))
else:
    pdfmetrics.registerFontFamily("Helvetica", normal="Helvetica", bold="Helvetica-Bold")
body = "Body" if font.exists() else "Helvetica"
strong = "BodyBold" if font.exists() else "Helvetica-Bold"
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="TitleSniply", fontName=strong, fontSize=31, leading=36, textColor=colors.HexColor("#26343A"), spaceAfter=18))
styles.add(ParagraphStyle(name="LabelSniply", fontName=strong, fontSize=9, leading=12, textColor=colors.HexColor("#C66B4B"), spaceAfter=15))
styles.add(ParagraphStyle(name="HeadingSniply", fontName=strong, fontSize=13, leading=18, textColor=colors.HexColor("#26343A"), spaceBefore=17, spaceAfter=8))
styles.add(ParagraphStyle(name="BodySniply", fontName=body, fontSize=10.5, leading=16, textColor=colors.HexColor("#354148"), spaceAfter=11))
styles.add(ParagraphStyle(name="SmallSniply", fontName=body, fontSize=9, leading=14, textColor=colors.HexColor("#68777D"), spaceAfter=11))
flow=[]
def text(value, style="BodySniply"):
    flow.append(Paragraph(escape(value), styles[style]))
def section(title, content):
    flow.append(KeepTogether([Paragraph(escape(title),styles["HeadingSniply"]),Paragraph(escape(content),styles["BodySniply"])]))
def page(label,title):
    if flow:flow.append(PageBreak())
    text(label,"LabelSniply");text(title,"TitleSniply")
page("01 / APRESENTAÇÃO", "Sniply, em poucas palavras.")
text("Guia de apoio para apresentar o projeto em entrevistas. Use como roteiro e adapte as respostas à sua própria compreensão. Não apresente decisões ou código que você ainda não revisou como domínio pessoal.")
section("O que é?", "Uma biblioteca pessoal de trechos de código. O usuário salva soluções úteis, organiza por coleções e tags, pesquisa quando precisa e compartilha somente os trechos que escolher.")
section("Qual problema resolve?", "Evita procurar repetidamente uma solução em arquivos, conversas ou abas antigas. O foco é reduzir o tempo entre lembrar de uma solução e encontrá-la, com contexto suficiente para reutilizá-la.")
section("Como eu explicaria em 30 segundos?", "O Sniply reúne os trechos de código que uso ou quero guardar. Fizemos uma interface React com um editor de código e uma API em ASP.NET Core que cuida das contas, das permissões e dos dados no PostgreSQL. Cada biblioteca é privada; um snippet só fica acessível sem login se o dono criar um link público, que pode ser revogado.")
section("Ano e reconstrução", "2024 é o ano original informado pelo autor. A pasta encontrada estava vazia, e esta implementação foi reconstruída a partir do briefing em novembro de 2026. Não há evidência de que o código atual já existisse em 2024.")
text("Estado: aplicação local funcional. Não existe, nesta entrega, um endereço público ou demonstração hospedada.","SmallSniply")
page("02 / ARQUITETURA", "Uma responsabilidade por camada.")
section("Interface: React e TypeScript", "A interface exibe os dados, recebe os comandos do usuário e mostra carregamento, erros e confirmações. React Router organiza as páginas. TanStack Query consulta a API e atualiza os dados depois das alterações. TypeScript ajuda a manter os formatos consistentes durante o desenvolvimento.")
section("Editor: Monaco", "Monaco é o editor usado para visualizar e editar o código, com realce de sintaxe, numeração de linhas e quebra de linha. Seus workers e as fontes são servidos localmente. O editor é carregado quando necessário, pois seus arquivos são maiores que os demais componentes.")
section("API: ASP.NET Core e C#", "Os controllers recebem as requisições HTTP. Os serviços de aplicação concentram os fluxos de conta e biblioteca. Os contratos validam os dados de entrada. A API decide quais registros o usuário pode acessar; esconder um botão na interface não substitui essa autorização.")
section("Dados: EF Core e PostgreSQL", "O EF Core representa as entidades e seus relacionamentos. O PostgreSQL persiste usuários, snippets, grupos, linguagens e sessões. As migrations descrevem a estrutura do banco; aplicá-las é um comando explícito, separado de iniciar a API.")
section("Como um snippet é salvo?", "A tela envia título, descrição, linguagem, código e grupos. A API valida os campos, confirma que a linguagem está disponível e que os grupos pertencem à conta. Depois grava e devolve o resultado. A interface atualiza as consultas e abre a visualização do trecho salvo.")
section("Por que busca no servidor?", "A biblioteca não precisa baixar todos os códigos para pesquisar. A API filtra título, descrição, conteúdo, linguagem e tags, aplica ordenação e retorna apenas a página solicitada.")
page("03 / SEGURANÇA E FLUXOS", "Privado por padrão.")
section("Como funciona o login?", "ASP.NET Identity armazena hashes de senha e aplica regras de senha e bloqueio por tentativas. A API emite um JWT curto, mantido em memória no frontend. A renovação usa um cookie HttpOnly, com SameSite=Strict, e uma sessão cujo token é armazenado como hash no banco e trocado na renovação.")
section("Como uma conta fica separada de outra?", "As consultas e alterações usam o identificador da conta autenticada. Conhecer o ID de um snippet não permite ler, editar ou excluir os dados de outra pessoa. Tags, categorias e coleções também precisam pertencer ao usuário que está salvando o código.")
section("E o compartilhamento?", "O dono cria um identificador aleatório para um snippet. O endpoint público retorna somente título, descrição, código e linguagem, sem e-mail do autor nem grupos privados. Qualquer pessoa com o link pode ler. Desativar o compartilhamento invalida o endereço. O código não é executado pela aplicação.")
section("Como recuperar a senha?", "A resposta não confirma se o e-mail existe. Para uma conta válida, a API cria um link de curta duração. Em desenvolvimento, sem SMTP, a mensagem fica em uma pasta privada local. Com SMTP configurado, o mesmo fluxo envia a mensagem. Redefinir a senha invalida os tokens e as sessões anteriores.")
section("O que ainda exige cuidado para publicar?", "HTTPS, cookies seguros, armazenamento protegido das chaves de proteção de dados, SMTP e remetente válidos, backups, limites operacionais e configuração do servidor. A configuração Docker atual é de desenvolvimento e não deve ser exposta diretamente na Internet.")
page("04 / DEMONSTRAÇÃO E LIMITES", "Mostre o que funciona.")
section("Roteiro de demonstração", "1. Entrar com uma conta local. 2. Criar uma coleção e uma tag. 3. Salvar um snippet com contexto e linguagem. 4. Pesquisar um termo que esteja dentro do código. 5. Editar e copiar o conteúdo. 6. Favoritar. 7. Explicar o link público e sua revogação. 8. Mostrar as preferências do editor e a adaptação para celular.")
section("Quais verificações foram feitas?", "Sete testes de integração isolados da API e três testes de funções do frontend passaram. Há cobertura de isolamento entre contas, busca e paginação, validação, compartilhamento e revogação, sessão, recuperação de senha e remoção de grupos. Também houve verificação prática com o PostgreSQL local e revisão no navegador. Isso não representa uma suíte completa de ponta a ponta.")
section("Por que os testes usam SQLite?", "Para executar verificações da API com um banco isolado e descartável, sem alterar os dados locais do desenvolvedor. Isso não prova equivalência total com PostgreSQL; por isso a migration e os fluxos principais também foram exercitados com o banco real local.")
section("Quais são os limites atuais?", "Não há hospedagem pública nem entrega SMTP real validada. Há cinco paletas, incluindo duas escuras, configuráveis na interface. As capturas usam dados fictícios. O Monaco gera arquivos grandes, embora seja carregado sob demanda. Há um commit local, mas nenhum repositório remoto configurado para push ou release.")
section("Como falar sobre o uso de IA?", "Ferramentas de IA apoiaram a documentação, a implementação, os ajustes visuais e a preparação dos testes. O briefing veio do desenvolvedor. Cabe ao desenvolvedor revisar, compreender e assumir a responsabilidade pelo resultado. Explique o que consegue justificar e diga com clareza o que ainda precisa aprofundar.")
text("Antes da entrevista: execute o projeto, percorra os fluxos e leia os serviços de conta e biblioteca. Uma explicação curta e verificável vale mais que uma lista de termos técnicos.","SmallSniply")
def footer(canvas,doc):
    canvas.setStrokeColor(colors.HexColor("#D9DFDB"));canvas.line(48,43,547,43)
    canvas.setFont(body,8);canvas.setFillColor(colors.HexColor("#68777D"));canvas.drawString(48,29,"SNIPLY / GUIA DE APRESENTAÇÃO / NOV 2026");canvas.drawRightString(547,29,str(doc.page))
SimpleDocTemplate(str(out),pagesize=(595.28,841.89),rightMargin=48,leftMargin=48,topMargin=47,bottomMargin=61,title="Sniply - Guia de apresentação",author="Sniply project").build(flow,onFirstPage=footer,onLaterPages=footer)
print(out)
