# Letrinhas do Gustavo

Jogo de traçar letras e números para crianças pequenas, **sem propagandas, sem compras e sem coleta de dados**.
Um lápis com olhinhos espera no começo do caminho; a criança arrasta o dedo por cima da letra e o lápis vai junto, pintando o traço com as cores do arco-íris.

**Jogar:** https://micheltlutz.github.io/letrinhas-do-gustavo/

## Instalar no iPad

1. Abra o link acima no **Safari**.
2. Toque em **Compartilhar** (quadrado com seta) → **Adicionar à Tela de Início**.
3. Abra o jogo pelo ícone **uma vez com internet**. Depois disso ele funciona offline.

Bom saber:
- O progresso fica salvo no app do ícone. Apagar o ícone apaga o progresso.
- A voz que fala o nome das letras é a do próprio iPad (funciona offline). Se ela não falar, confira se o iPad não está no modo silencioso.
- **Acesso Guiado** (Ajustes → Acessibilidade → Acesso Guiado; depois clique três vezes no botão lateral) mantém a criança dentro do jogo.
- Atualizações chegam sozinhas quando o jogo é aberto com internet (são aplicadas fora da folha de traçar).

## Como se joga

- Cada letra é uma **pista pontilhada**. A bolinha verde (com uma setinha) mostra onde começar, a estrela mostra onde o traço termina e uma bolinha amarela passeia pelo caminho mostrando a direção.
- Arraste o dedo por cima do caminho: o **lápis anda e pinta**, com notinhas musicais e brilhinhos.
- Se o dedo **sair muito do caminho, o lápis para** e fica balançando, esperando. É só voltar com o dedo perto dele.
- Os traços seguem a **ordem de escrita** da letra de forma (de cima para baixo, da esquerda para a direita). Quando um traço termina, o lápis pula para o começo do próximo.
- Letra completa: confete, música, uma estrela e a voz fala o nome da letra. Tocar na letra do botão redondo também fala o nome.
- **Mapa:** A a Z e 0 a 9 (36 casas), todas liberadas. As feitas ganham estrela.
- **Maiúsculas ou minúsculas:** a chave **A / a** no canto do mapa troca as letras. As minúsculas usam as linhas do caderno: as altas (b, d, h, l…) sobem até a linha de cima e as que descem (g, j, p, q, y) passam da linha de base. O pingo do i e do j é só tocar.
- **GUSTAVO / Gustavo:** o botão com o nome no mapa leva a escrever o nome, letra por letra, com um troféu no final (em maiúsculas ou como se escreve um nome, conforme a chave).

## Desenvolvimento

Requer Node 24 ou mais novo.

```sh
npm install
npm run dev -- --host   # abre na rede local (teste no iPad pela Wi-Fi)
npm test                # geometria, seguidor do dedo e todas as letras
npm run build           # versão final em dist/
npm run icons           # gera os ícones PNG a partir de public/icon.svg
```

Estrutura:
- `src/glyphs/glyphs.ts`: as letras (maiúsculas e minúsculas) e números, traço a traço (retas, arcos e curvas num quadrado de 100 x 100).
- `src/glyphs/tracker.ts`: segue o dedo — o lápis só anda para a frente, pelo caminho, enquanto o dedo está perto; cada traço começa com o dedo no início dele.
- `src/ui/letterView.ts`: a folha, a pista, o traço colorido e o lápis.
- `src/ui/pencil.ts`: o lápis com olhinhos e as cores do arco-íris.
- `src/ui/screens.ts`: telas inicial, mapa e folha.
- `src/audio/sfx.ts`: sons sintetizados e a voz.

Os testes simulam um dedo tremendo traçando cada letra e número: tem que dar para terminar todos, sem o lápis pular pedaços.

Cada push na branch `main` roda os testes e publica no GitHub Pages.
