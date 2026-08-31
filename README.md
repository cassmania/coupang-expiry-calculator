# 쿠팡 유통기한 계산기

별도 설치나 빌드 없이 GitHub Pages에 배포할 수 있는 정적 웹사이트입니다.

## 로컬에서 확인하기

`index.html`을 더블 클릭하거나, 이 폴더에서 아래 명령을 실행합니다.

```powershell
python -m http.server 4173
```

그다음 브라우저에서 `http://localhost:4173`을 엽니다.

## GitHub Pages에 배포하기

1. GitHub에서 새 저장소를 만듭니다.
2. 이 폴더의 `index.html`, `README.md`, `.nojekyll`을 저장소 최상위에 올립니다.
3. 저장소의 **Settings → Pages**로 이동합니다.
4. **Build and deployment**에서 **Deploy from a branch**를 선택합니다.
5. Branch를 `main`, 폴더를 `/(root)`로 선택하고 **Save**를 누릅니다.

배포가 완료되면 `https://사용자이름.github.io/저장소이름/` 주소로 접속할 수 있습니다.

## 계산 기준

제조일자를 첫날로 포함해 다음 식으로 계산합니다.

```text
유통기한 = 제조일자 + 유효기간 일수 - 1일
```
