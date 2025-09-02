# Consulta de CEP & Previsão do Tempo (ViaCEP / BrasilAPI / Nominatim / Open-Meteo)

🔗 **Demo (Vercel): [https://consulta-cep-previs-o.vercel.app]**  

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
