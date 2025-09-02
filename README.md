# Consulta de CEP & Previsão do Tempo (ViaCEP / BrasilAPI / Nominatim / Open-Meteo)

🔗 **Demo (Vercel): [https://seu-projeto.vercel.app](https://consulta-cep-previs-o.vercel.app/)([https://seu-projeto.vercel.app](https://consulta-cep-previs-o.vercel.app/))**  
> Substitua pelo link real após o deploy.

Aplicação front-end simples (HTML + Bootstrap + JavaScript) para:
1) Buscar endereço a partir do **CEP** (ViaCEP),
2) **Preencher automaticamente** latitude/longitude (BrasilAPI, com *fallback* Nominatim),
3) Consultar a **previsão horária** de temperatura (Open-Meteo),
4) Navegar pelos resultados com **paginação de horas** (6h/12h/24h).

---

## ✨ Funcionalidades

- **Busca de CEP** com máscara `00000-000` e validação HTML5/Bootstrap.
- **Preenchimento automático** de `Rua`, `Bairro`, `Cidade`.
- Tentativa de **coordenadas** via **BrasilAPI CEP v2**; se não houver, faz *geocoding* com **Nominatim/OSM**.
- **Previsão horária** (temperatura a 2m) via **Open-Meteo**, já no fuso `America/Sao_Paulo`.
- **Paginação de horas**: 6h, 12h ou 24h por página, com botões **Anterior/Próxima**.
- **UX/A11y**: botões com **spinner**, `aria-busy`, mensagens com `aria-live`, validação `was-validated`.
- **Robustez**: timeouts de rede, checagem de `response.ok`, verificação defensiva de `data.hourly`.

---

## 🧰 Stack

- **HTML5** semântico + **Bootstrap 5** (via CDN).
- **JavaScript** (ES Modules): `index.js` separado, sem bibliotecas externas.
- **APIs públicas**: ViaCEP, BrasilAPI CEP v2, Nominatim (OSM) e Open-Meteo.

---

## 📁 Estrutura do projeto

.
├─ index.html # UI + formulários (CEP e Previsão) + controles de paginação
├─ index.js # Lógica JS (máscara, fetchs, timeout, paginação, render)
└─ README.md

📝 Como usar
CEP → Endereço + Coordenadas

Digite um CEP válido (ex.: 01001-000) e clique OK.

O app:

Consulta ViaCEP → preenche Rua/Bairro/Cidade.

Tenta BrasilAPI CEP v2 → se houver latitude/longitude, preenche.

Caso não haja, tenta Nominatim (geocodifica o endereço).

Você verá o status (ex.: “Endereço encontrado · Coordenadas via BrasilAPI.”).

Previsão

Com Latitude e Longitude preenchidas (manualmente ou via CEP), clique OK.

A lista de horas aparece; use os controles de pagina (6h/12h/24h, Anterior/Próxima).

Exemplos

CEP: 01001-000 (São Paulo)

Coordenadas (SP Centro): Latitude -23.55 / Longitude -46.63

🔌 APIs & Fluxos
ViaCEP → GET /ws/{cep}/json/
Retorna endereço por CEP. Checamos response.ok e data.erro.

BrasilAPI CEP v2 → GET /api/cep/v2/{cep}
Quando disponível, traz location.coordinates.latitude/longitude. Se ausente, caímos no fallback.

Nominatim (OpenStreetMap) → GET /search?q=...&format=json&limit=1&countrycodes=br
Fallback para geocodificação do endereço (logradouro, bairro, cidade, BR).

Open-Meteo → GET /v1/forecast?latitude={lat}&longitude={lon}&hourly=temperature_2m&timezone=America/Sao_Paulo
Devolve séries horárias. Validamos a existência dos arrays hourly.time e hourly.temperature_2m.

🛡️ Acessibilidade, UX e Segurança
Formulários: required, pattern, type=number, min/max, step=any.

Feedback: was-validated (Bootstrap); mensagens de status com aria-live="polite".

Loading: botões com spinner + aria-busy.

Timeout: AbortController + setTimeout (evita “travamentos”).

Segurança de DOM: uso de textContent (em vez de innerHTML +=).

Performance: replaceChildren() e construção de nós (evita reflows em loop e parsing de HTML desnecessário).

⚠️ Limitações & Observações
Geocodificação por Nominatim pode estar sujeita a limites de uso e políticas de identificação;
para apps públicos, proxie via backend.

A qualidade das coordenadas da BrasilAPI depende da base de dados disponível para o CEP.

Apenas temperatura está habilitada; outras variáveis (umidade, vento) podem ser adicionadas.

O fuso é fixo em America/Sao_Paulo; ajuste se for usar em outras regiões.

👨‍💻 Desenvolvimento
Código JavaScript em index.js (módulo ES).

Boas práticas:

Sem onclick inline — eventos registrados no JS.

Checagem de response.ok e de estrutura das respostas.

try/catch/finally com AbortError tratado.
