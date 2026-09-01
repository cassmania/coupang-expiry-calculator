// 화면에서 사용할 입력창과 결과 영역을 한 번만 찾아 보관합니다.
const manufactureDateInput = document.getElementById("manufactureDate");
const shelfLifeDaysInput = document.getElementById("shelfLifeDays");
const dateDisplay = document.getElementById("dateDisplay");
const resultContainer = document.getElementById("resultContainer");
const emptyState = document.getElementById("emptyState");
const installButton = document.getElementById("installButton");
const installButtonLabel = document.getElementById("installButtonLabel");
const installDialog = document.getElementById("installDialog");
const installDialogTitle = document.getElementById("installDialogTitle");
const installSteps = document.getElementById("installSteps");
const externalBrowserButton = document.getElementById("externalBrowserButton");
const copyPageLinkButton = document.getElementById("copyPageLinkButton");
const installActionMessage = document.getElementById("installActionMessage");
const closeInstallDialogButton = document.getElementById("closeInstallDialog");

let deferredInstallPrompt = null;

// YYYY-MM-DD 문자열을 사용자의 현지 날짜로 변환해 시간대에 따른 날짜 오차를 막습니다.
function parseLocalDate(dateValue) {
    const [year, month, day] = dateValue.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const weekdays = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

    return `${year}년 ${month}월 ${day}일 (${weekdays[date.getDay()]})`;
}

function formatShortDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}/${day}`;
}

// 남은 일수에 따라 결과 카드의 안내 문구와 색상을 결정합니다.
function getStatusStyle(daysUntilExpiry) {
    if (daysUntilExpiry < 0) {
        return {
            text: "유통기한이 지났습니다",
            background: "#fef2f2",
            color: "#c81e1e",
            border: "#fecaca"
        };
    }

    if (daysUntilExpiry <= 7) {
        return {
            text: `유통기한까지 ${daysUntilExpiry}일 남음`,
            background: "#fffbea",
            color: "#b65d00",
            border: "#fde68a"
        };
    }

    return {
        text: `유통기한까지 ${daysUntilExpiry}일 남음`,
        background: "#effcf5",
        color: "#087443",
        border: "#a7f3d0"
    };
}

function hideResult() {
    resultContainer.hidden = true;
    resultContainer.innerHTML = "";
    emptyState.hidden = false;
}

function displayResult(expiryDate, daysUntilExpiry, manufactureDate, shelfLifeDays) {
    const status = getStatusStyle(daysUntilExpiry);
    const formattedExpiry = formatDate(expiryDate);
    const [expiryText, weekdayText] = formattedExpiry.split(" (");

    resultContainer.innerHTML = `
        <div class="result-card" style="background: ${status.background}; border-color: ${status.border};">
            <div class="result-header">
                <p class="result-label">유통기한</p>
                <p class="expiry-date">${expiryText}</p>
                <p class="expiry-day">(${weekdayText}</p>
            </div>

            <div class="status-box" style="background: ${status.background};">
                <p class="status-text" style="color: ${status.color};">${status.text}</p>
            </div>

            <div class="summary-grid">
                <div class="summary-item">
                    <p class="summary-label">제조일자</p>
                    <p class="summary-value">${formatShortDate(manufactureDate)}</p>
                </div>
                <div class="summary-item">
                    <p class="summary-label">유효기간</p>
                    <p class="summary-value">${shelfLifeDays}일</p>
                </div>
            </div>

            <div class="action-buttons">
                <button type="button" class="btn-reset" id="resetButton">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                        <path d="M3 3v5h5"></path>
                    </svg>
                    초기화
                </button>
                <button type="button" class="btn-copy" id="copyButton">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    복사하기
                </button>
            </div>
            <p class="copy-message" id="copyMessage" aria-live="polite"></p>
        </div>
    `;

    resultContainer.hidden = false;
    emptyState.hidden = true;

    document.getElementById("resetButton").addEventListener("click", resetForm);
    document.getElementById("copyButton").addEventListener("click", copyResult);
}

// 제조일자를 첫날로 포함하므로 제조일자 + 유효기간 - 1일을 결과로 계산합니다.
function calculateExpiry() {
    const manufactureDateValue = manufactureDateInput.value;
    const shelfLifeDays = Number.parseInt(shelfLifeDaysInput.value, 10);

    if (!manufactureDateValue || !Number.isInteger(shelfLifeDays) || shelfLifeDays < 1) {
        hideResult();
        return;
    }

    const manufactureDate = parseLocalDate(manufactureDateValue);
    const expiryDate = new Date(manufactureDate);
    expiryDate.setDate(expiryDate.getDate() + shelfLifeDays - 1);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayInMilliseconds = 1000 * 60 * 60 * 24;
    const daysUntilExpiry = Math.round((expiryDate.getTime() - today.getTime()) / dayInMilliseconds);

    displayResult(expiryDate, daysUntilExpiry, manufactureDate, shelfLifeDays);
}

function resetForm() {
    manufactureDateInput.value = "";
    shelfLifeDaysInput.value = "";
    dateDisplay.textContent = "";
    dateDisplay.hidden = true;
    hideResult();
    manufactureDateInput.focus();
}

async function copyResult() {
    const manufactureDateValue = manufactureDateInput.value;
    const shelfLifeDays = Number.parseInt(shelfLifeDaysInput.value, 10);
    const manufactureDate = parseLocalDate(manufactureDateValue);
    const expiryDate = new Date(manufactureDate);
    const copyMessage = document.getElementById("copyMessage");

    expiryDate.setDate(expiryDate.getDate() + shelfLifeDays - 1);

    const resultText = [
        `제조일자: ${formatDate(manufactureDate).split(" (")[0]}`,
        `유효기간: ${shelfLifeDays}일`,
        `유통기한: ${formatDate(expiryDate).split(" (")[0]}`
    ].join("\n");

    try {
        await navigator.clipboard.writeText(resultText);
        copyMessage.textContent = "결과를 클립보드에 복사했습니다.";
    } catch (error) {
        copyMessage.textContent = "복사할 수 없습니다. 브라우저 권한을 확인해 주세요.";
    }
}

// 홈 화면 앱으로 실행 중인지 확인해 중복 설치 버튼을 숨깁니다.
function isStandaloneMode() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

// 카카오톡 내부 브라우저와 운영체제를 구분해 알맞은 설치 경로를 선택합니다.
function getBrowserContext(userAgent = navigator.userAgent) {
    const normalizedUserAgent = userAgent.toLowerCase();
    return {
        isKakao: normalizedUserAgent.includes("kakaotalk"),
        isIOS: /iphone|ipad|ipod/.test(normalizedUserAgent),
        isAndroid: normalizedUserAgent.includes("android")
    };
}

// 설치에 사용할 공개 주소에서 캐시 확인용 쿼리와 화면 위치값을 제거합니다.
function getCanonicalAppUrl(currentUrl = window.location.href) {
    const url = new URL(currentUrl);
    url.search = "";
    url.hash = "";
    return url.href;
}

// Android의 사용자 클릭으로 Chrome을 여는 표준 Intent 주소를 만듭니다.
function buildAndroidChromeIntent(currentUrl = window.location.href) {
    const appUrl = new URL(getCanonicalAppUrl(currentUrl));
    const intentTarget = `${appUrl.host}${appUrl.pathname}`;
    return `intent://${intentTarget}#Intent;scheme=${appUrl.protocol.replace(":", "")};` +
        `package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(appUrl.href)};end`;
}

// iPhone, Android, 카카오톡은 설치 방식이 달라 기기에 맞는 안내를 제공합니다.
function getInstallGuide(userAgent = navigator.userAgent) {
    const browserContext = getBrowserContext(userAgent);

    if (browserContext.isKakao && browserContext.isIOS) {
        return {
            title: "Safari에서 열어 설치하세요",
            steps: [
                "카카오톡 화면의 점 3개(⋯) 또는 공유 메뉴를 누르세요.",
                "‘다른 브라우저로 열기’ 또는 ‘Safari로 열기’를 선택하세요.",
                "Safari의 공유 버튼(□↑)에서 ‘홈 화면에 추가’를 누르세요."
            ],
            showExternalBrowser: false,
            showCopyLink: true,
            closeLabel: "나중에"
        };
    }

    if (browserContext.isKakao && browserContext.isAndroid) {
        return {
            title: "Chrome에서 열어 설치하세요",
            steps: [
                "카카오톡 내부에서는 홈 화면 설치 메뉴가 표시되지 않을 수 있습니다.",
                "아래 ‘Chrome으로 열기’를 누르세요.",
                "Chrome에서 ‘홈 화면에 추가’를 눌러 설치하세요."
            ],
            showExternalBrowser: true,
            showCopyLink: true,
            closeLabel: "나중에"
        };
    }

    if (browserContext.isIOS) {
        return {
            title: "iPhone 홈 화면에 추가",
            steps: [
                "Safari에서 아래쪽 공유 버튼(□↑)을 누르세요.",
                "메뉴에서 ‘홈 화면에 추가’를 선택하세요.",
                "‘웹 앱으로 열기’를 켠 뒤 ‘추가’를 누르세요."
            ],
            showExternalBrowser: false,
            showCopyLink: false,
            closeLabel: "확인"
        };
    }

    if (browserContext.isAndroid) {
        return {
            title: "Android 홈 화면에 추가",
            steps: [
                "브라우저 오른쪽 위의 점 3개(⋮) 메뉴를 누르세요.",
                "‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택하세요.",
                "표시되는 확인 창에서 ‘설치’를 누르세요."
            ],
            showExternalBrowser: false,
            showCopyLink: false,
            closeLabel: "확인"
        };
    }

    return {
        title: "홈 화면에 추가",
        steps: [
            "브라우저 메뉴를 여세요.",
            "‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택하세요.",
            "화면의 안내에 따라 설치를 완료하세요."
        ],
        showExternalBrowser: false,
        showCopyLink: false,
        closeLabel: "확인"
    };
}

function openInstallGuide(userAgent = navigator.userAgent) {
    const guide = getInstallGuide(userAgent);
    installDialogTitle.textContent = guide.title;
    installSteps.innerHTML = guide.steps.map((step) => `<li>${step}</li>`).join("");
    externalBrowserButton.hidden = !guide.showExternalBrowser;
    copyPageLinkButton.hidden = !guide.showCopyLink;
    installActionMessage.hidden = true;
    installActionMessage.textContent = "";
    closeInstallDialogButton.textContent = guide.closeLabel;
    installDialog.hidden = false;

    if (guide.showExternalBrowser) {
        externalBrowserButton.focus();
    } else if (guide.showCopyLink) {
        copyPageLinkButton.focus();
    } else {
        closeInstallDialogButton.focus();
    }
}

function closeInstallGuide() {
    installDialog.hidden = true;
    installButton.focus();
}

// Android 카카오톡에서는 사용자 클릭을 통해 Chrome으로 현재 공개 주소를 엽니다.
function openInAndroidChrome() {
    window.location.href = buildAndroidChromeIntent();
}

// 카카오톡의 클립보드 제한에 대비해 구형 복사 방식도 함께 제공합니다.
async function copyPageLink() {
    const appUrl = getCanonicalAppUrl();
    let copied = false;

    try {
        await navigator.clipboard.writeText(appUrl);
        copied = true;
    } catch (error) {
        const temporaryInput = document.createElement("textarea");
        temporaryInput.value = appUrl;
        temporaryInput.setAttribute("readonly", "");
        temporaryInput.style.position = "fixed";
        temporaryInput.style.opacity = "0";
        document.body.appendChild(temporaryInput);
        temporaryInput.select();
        try {
            copied = document.execCommand("copy");
        } catch (fallbackError) {
            copied = false;
        } finally {
            temporaryInput.remove();
        }
    }

    installActionMessage.textContent = copied
        ? "링크를 복사했습니다. Safari 또는 Chrome 주소창에 붙여넣으세요."
        : "복사가 막혔습니다. 카카오톡 메뉴에서 ‘다른 브라우저로 열기’를 선택하세요.";
    installActionMessage.hidden = false;
}

// 카카오톡에서 처음 링크를 열었을 때만 외부 브라우저 안내를 자동 표시합니다.
function showKakaoGuideOnce(userAgent = navigator.userAgent) {
    if (!getBrowserContext(userAgent).isKakao || isStandaloneMode()) {
        return;
    }

    const storageKey = "kakao-install-guide-shown";
    try {
        if (sessionStorage.getItem(storageKey)) {
            return;
        }
        sessionStorage.setItem(storageKey, "true");
    } catch (error) {
        // 저장소가 차단된 환경에서도 현재 페이지에서는 안내를 한 번 표시합니다.
    }

    openInstallGuide(userAgent);
}

async function requestAppInstall() {
    if (isStandaloneMode()) {
        installButton.hidden = true;
        return;
    }

    if (getBrowserContext().isKakao || !deferredInstallPrompt) {
        openInstallGuide();
        return;
    }

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
}

// Android Chrome 등에서 제공하는 실제 설치 팝업을 보관해 버튼 클릭 때 사용합니다.
window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.hidden = false;
});

window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installButton.hidden = true;
    closeInstallGuide();
});

// 서비스 워커는 HTTPS GitHub Pages와 localhost에서 등록됩니다.
if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
        try {
            await navigator.serviceWorker.register("./sw.js", { scope: "./" });
        } catch (error) {
            console.error("서비스 워커 등록에 실패했습니다.", error);
        }
    });
}

manufactureDateInput.addEventListener("change", () => {
    if (manufactureDateInput.value) {
        dateDisplay.textContent = formatDate(parseLocalDate(manufactureDateInput.value));
        dateDisplay.hidden = false;
    } else {
        dateDisplay.textContent = "";
        dateDisplay.hidden = true;
    }

    calculateExpiry();
});

shelfLifeDaysInput.addEventListener("input", calculateExpiry);
installButton.addEventListener("click", requestAppInstall);
externalBrowserButton.addEventListener("click", openInAndroidChrome);
copyPageLinkButton.addEventListener("click", copyPageLink);
closeInstallDialogButton.addEventListener("click", closeInstallGuide);
installDialog.addEventListener("click", (event) => {
    if (event.target === installDialog) {
        closeInstallGuide();
    }
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !installDialog.hidden) {
        closeInstallGuide();
    }
});

const initialBrowserContext = getBrowserContext();
installButtonLabel.textContent = initialBrowserContext.isKakao
    ? "외부 브라우저에서 열기"
    : "홈 화면에 추가";
installButton.hidden = isStandaloneMode();
window.addEventListener("load", () => showKakaoGuideOnce());
hideResult();
