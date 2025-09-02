const $ = (id) => document.getElementById(id);

const withTimeout = (ms = 8000) => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), ms);
    return { signal: controller.signal, clear: () => clearTimeout(t) };
};

const applyBootstrapValidation = (form) => {
    form.addEventListener(
        "submit",
        (e) => {
            if (!form.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
            }
            form.classList.add("was-validated");
        },
        { capture: true }
    );
};

const setLoading = (
    btn,
    spinnerEl,
    labelEl,
    isLoading,
    idleText = "OK",
    loadingText = "Buscando..."
) => {
    if (!btn) return;
    btn.disabled = isLoading;
    btn.setAttribute("aria-busy", String(isLoading));
    if (spinnerEl) {
        spinnerEl.classList.toggle("d-none", !isLoading);
    }
    if (labelEl) {
        labelEl.textContent = isLoading ? loadingText : idleText;
    }
};

const cepForm = $("cepForm");
const cepBtn = $("cepBtn");
const cepSpinner = $("cepSpinner");
const cepBtnLabel = $("cepBtnLabel");
const cepStatus = $("cepStatus");
const cepInput = $("cep");

if (cepForm) applyBootstrapValidation(cepForm);

const formatCEP = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

cepInput?.addEventListener("input", () => {
    const formatted = formatCEP(cepInput.value);
    if (cepInput.value !== formatted) cepInput.value = formatted;
});

const sanitizeCep = (value) => value.replace(/\D/g, "");

cepForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!cepForm.checkValidity()) return;

    const cep = sanitizeCep(cepInput.value);
    if (cep.length !== 8) {
        if (cepStatus) cepStatus.textContent = "CEP deve ter 8 dígitos.";
        return;
    }

    setLoading(cepBtn, cepSpinner, cepBtnLabel, true, "OK", "Buscando...");
    if (cepStatus) cepStatus.textContent = "";

    const { signal, clear } = withTimeout(8000);

    try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal });
        if (!res.ok) throw new Error("Falha ao consultar o ViaCEP.");
        const data = await res.json();

        if (data.erro) throw new Error("CEP não encontrado.");

        $("rua").value = data.logradouro || "";
        $("bairro").value = data.bairro || "";
        $("cidade").value = data.localidade || "";
        if (cepStatus) cepStatus.textContent = "Endereço encontrado.";

        await fillCoordsFromCep(cep, data);
    } catch (err) {
        if (cepStatus) {
            cepStatus.textContent =
                err.name === "AbortError"
                    ? "Tempo esgotado na consulta."
                    : err.message || "Erro ao buscar CEP.";
        }
    } finally {
        clear();
        setLoading(cepBtn, cepSpinner, cepBtnLabel, false, "OK");
    }
});

async function fillCoordsFromCep(cep, viaCepData) {
    try {
        const r = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
        const j = await r.json();
        if (
            r.ok &&
            j?.location?.coordinates?.latitude &&
            j?.location?.coordinates?.longitude
        ) {
            $("latitude").value = String(j.location.coordinates.latitude);
            $("longitude").value = String(j.location.coordinates.longitude);
            if (cepStatus)
                cepStatus.textContent =
                    (cepStatus.textContent ? cepStatus.textContent + " · " : "") +
                    "Coordenadas via BrasilAPI.";
            return true;
        }
    } catch (_) {
    }

    try {
        const parts = [
            viaCepData?.logradouro,
            viaCepData?.bairro,
            viaCepData?.localidade,
            "Brasil",
        ]
            .filter(Boolean)
            .join(", ");

        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("q", parts);
        url.searchParams.set("format", "json");
        url.searchParams.set("limit", "1");
        url.searchParams.set("addressdetails", "1");
        url.searchParams.set("countrycodes", "br");

        const r2 = await fetch(url.toString(), {
            headers: { Accept: "application/json" },
        });
        const arr = await r2.json();
        if (Array.isArray(arr) && arr[0]?.lat && arr[0]?.lon) {
            $("latitude").value = arr[0].lat;
            $("longitude").value = arr[0].lon;
            if (cepStatus)
                cepStatus.textContent =
                    (cepStatus.textContent ? cepStatus.textContent + " · " : "") +
                    "Coordenadas via Nominatim.";
            return true;
        }
    } catch (_) {
    }

    if (cepStatus)
        cepStatus.textContent =
            (cepStatus.textContent ? cepStatus.textContent + " · " : "") +
            "Sem coordenadas.";
    return false;
}

const meteoForm = $("meteoForm");
const meteoBtn = $("meteoBtn");
const meteoSpinner = $("meteoSpinner");
const meteoBtnLabel = $("meteoBtnLabel");
const meteoStatus = $("meteoStatus");
const resposta = $("resposta");

const hoursPerPageSel = $("hoursPerPage");
const prevPageBtn = $("prevPage");
const nextPageBtn = $("nextPage");
const pageStatus = $("pageStatus");

let meteoTimes = [];
let meteoTemps = [];
let pageIndex = 0;
let pageSize = Number(hoursPerPageSel?.value || 24);

if (meteoForm) applyBootstrapValidation(meteoForm);

function renderMeteoPage() {
    if (!resposta) return;
    resposta.replaceChildren();

    if (!meteoTimes.length || !meteoTemps.length) {
        if (pageStatus) pageStatus.textContent = "";
        if (prevPageBtn) prevPageBtn.disabled = true;
        if (nextPageBtn) nextPageBtn.disabled = true;
        return;
    }

    const total = meteoTimes.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    pageIndex = Math.min(pageIndex, totalPages - 1);

    const start = pageIndex * pageSize;
    const end = Math.min(start + pageSize, total);

    const list = document.createElement("div");
    list.className = "list-group";

    const dtf = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
    });

    for (let i = start; i < end; i++) {
        const item = document.createElement("div");
        item.className = "list-group-item d-flex justify-content-between";
        const when = new Date(meteoTimes[i]);

        const left = document.createElement("span");
        left.textContent = dtf.format(when);

        const right = document.createElement("strong");
        right.textContent = `${Number(meteoTemps[i]).toFixed(1)} °C`;

        item.append(left, right);
        list.appendChild(item);
    }

    resposta.appendChild(list);

    if (pageStatus)
        pageStatus.textContent = `Página ${pageIndex + 1} de ${totalPages} (${end - start}h mostradas)`;
    if (prevPageBtn) prevPageBtn.disabled = pageIndex === 0;
    if (nextPageBtn) nextPageBtn.disabled = pageIndex >= totalPages - 1;
}

hoursPerPageSel?.addEventListener("change", () => {
    pageSize = Number(hoursPerPageSel.value);
    pageIndex = 0;
    renderMeteoPage();
});

prevPageBtn?.addEventListener("click", () => {
    if (pageIndex > 0) {
        pageIndex--;
        renderMeteoPage();
    }
});

nextPageBtn?.addEventListener("click", () => {
    const totalPages = Math.ceil(meteoTimes.length / pageSize);
    if (pageIndex < totalPages - 1) {
        pageIndex++;
        renderMeteoPage();
    }
});

meteoForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!meteoForm.checkValidity()) return;

    const lat = parseFloat($("latitude").value.trim().replace(",", "."));
    const lon = parseFloat($("longitude").value.trim().replace(",", "."));

    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        lat < -90 ||
        lat > 90 ||
        lon < -180 ||
        lon > 180
    ) {
        if (meteoStatus)
            meteoStatus.textContent =
                "Coordenadas inválidas. Ex.: Latitude -23.55, Longitude -46.63";
        return;
    }

    setLoading(meteoBtn, meteoSpinner, meteoBtnLabel, true, "OK", "Buscando...");
    if (meteoStatus) meteoStatus.textContent = "";
    resposta?.replaceChildren();

    const { signal, clear } = withTimeout(8000);

    try {
        const url = new URL("https://api.open-meteo.com/v1/forecast");
        url.searchParams.set("latitude", String(lat));
        url.searchParams.set("longitude", String(lon));
        url.searchParams.set("hourly", "temperature_2m");
        url.searchParams.set("timezone", "America/Sao_Paulo");

        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error("Falha ao consultar o Open-Meteo.");
        const data = await res.json();

        const hourly = data && data.hourly;
        const times = hourly && Array.isArray(hourly.time) ? hourly.time : null;
        const temps =
            hourly && Array.isArray(hourly.temperature_2m)
                ? hourly.temperature_2m
                : null;

        if (!times || !temps) {
            const reason =
                (data && (data.reason || data.error)) ||
                "Resposta sem bloco 'hourly'.";
            if (meteoStatus)
                meteoStatus.textContent = `A API não retornou dados horários. ${reason}`;
            return;
        }

        meteoTimes = times;
        meteoTemps = temps;
        pageIndex = 0;
        renderMeteoPage();

        if (meteoStatus)
            meteoStatus.textContent = "Use os controles para navegar pelas horas.";
    } catch (err) {
        if (meteoStatus)
            meteoStatus.textContent =
                err.name === "AbortError"
                    ? "Tempo esgotado na consulta."
                    : `Erro: ${err.message}`;
    } finally {
        clear();
        setLoading(meteoBtn, meteoSpinner, meteoBtnLabel, false, "OK");
    }
});
