# Calculadora de Rentabilidade NTN-B

Uma calculadora profissional para projeção de rentabilidade de títulos NTN-B (Notas do Tesouro Nacional série B) do Tesouro Direto, otimizada para RPPS (Regime Próprio de Previdência Social).

## Características

### Cálculos Precisos
- **Taxa de Cupom Correta**: 6% ao ano, distribuído em 3% semestralmente (taxa simples)
- **Cupons Pro-Rata**: Cálculo proporcional para compras entre datas de cupom
- **Projeção de IPCA**: Atualização do VNA (Valor Nominal Atualizado) com inflação projetada
- **Taxa de Custódia B3**: Desconto automático de 0.20% a.a. para posições acima de R$ 10.000

### Validações Robustas
- **Feriados da B3**: Ajuste automático de datas de pagamento para dias úteis
- **Validação de Datas**: Verificação de datas de compra em dias úteis
- **Validação de Entrada**: Verificação de valores e datas válidos

### Interface Moderna
- **React + TypeScript**: Código tipado e seguro
- **Tailwind CSS**: Design moderno e responsivo
- **Recharts**: Visualização gráfica dos resultados
- **Feedback em Tempo Real**: Mensagens de erro claras

## Metodologia de Cálculo

### 1. Valor Nominal Atualizado (VNA)
O VNA é atualizado pela inflação (IPCA) projetada:

```
VNA(t) = VNA(compra) × (1 + IPCA)^anos
```

### 2. Cupons Semestrais
Os cupons são pagos em 15 de maio e 15 de novembro de cada ano:

```
Cupom = VNA(data_cupom) × 3% × Quantidade
```

### 3. Cupons Pro-Rata
Para compras entre datas de cupom, calcula-se proporcionalmente:

```
Fator Pro-Rata = Dias até próximo cupom / Total de dias do período
Cupom Pro-Rata = VNA × 3% × Fator Pro-Rata × Quantidade
```

### 4. Taxa de Custódia B3
Para posições acima de R$ 10.000:

```
Taxa = Investimento Total × 0.20% × Anos
```

### 5. Rentabilidade Anualizada
```
Retorno = [(Valor Total Recebido / Investimento)^(1/anos) - 1] × 100%
```

## Como Usar

### Pré-requisitos
- Node.js (versão 18 ou superior)

### Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd CFM-teste-claude
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

4. Abra o navegador em `http://localhost:3000`

### Build de Produção

```bash
npm run build
npm run preview
```

## Estrutura do Projeto

```
/
├── utils/
│   ├── calculator.ts      # Lógica principal de cálculo
│   └── holidays.ts        # Gerenciamento de feriados da B3
├── components/
│   ├── CalculatorForm.tsx # Formulário de entrada
│   ├── ResultsDisplay.tsx # Exibição de resultados
│   └── ResultsChart.tsx   # Gráfico de fluxo de caixa
├── types.ts               # Definições TypeScript
└── App.tsx                # Componente principal
```

## Especificações Técnicas

### Cálculos de Data
- Usa UTC para evitar problemas de timezone
- Considera 252 dias úteis por ano (padrão brasileiro)
- Ajusta automaticamente datas para próximo dia útil

### Feriados Considerados
- Feriados nacionais fixos
- Feriados móveis (Carnaval, Sexta-feira Santa, Corpus Christi)
- Feriados específicos da B3 (vésperas de Natal e Ano Novo)

### Validações Implementadas
- Quantidade e preço devem ser positivos
- Datas devem estar no formato AAAA-MM-DD
- Data de vencimento deve ser posterior à data de compra
- Data de compra deve ser um dia útil

## Melhorias Implementadas (2025-10-29)

1. **Correção da Taxa de Cupom**: Alterada de taxa equivalente composta para taxa simples (3% semestral)
2. **Módulo de Feriados B3**: Criado sistema completo de validação de dias úteis
3. **Cupons Pro-Rata**: Implementado cálculo proporcional para compras entre cupons
4. **Taxa de Custódia**: Adicionado desconto automático da taxa B3
5. **Validações Aprimoradas**: Verificação de dias úteis e datas válidas
6. **Cálculo de Tempo**: Uso de 252 dias úteis por ano (mais preciso)

## Observações Importantes

- Esta calculadora é otimizada para **RPPS** (isenta de Imposto de Renda)
- Os valores são projeções baseadas em IPCA estimado
- A rentabilidade real pode variar conforme o IPCA efetivo
- Custos de corretagem não estão incluídos

## Licença

Este projeto é parte de um teste técnico para CFM.

## Suporte

Para dúvidas ou problemas, abra uma issue no repositório.
