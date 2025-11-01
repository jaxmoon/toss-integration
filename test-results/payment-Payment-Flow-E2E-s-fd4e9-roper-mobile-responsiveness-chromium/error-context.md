# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e5]:
    - img [ref=e7]
    - heading "관리자 로그인" [level=1] [ref=e9]
    - paragraph [ref=e10]: Search Admin 대시보드에 로그인하세요
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]:
          - text: 사용자 이름
          - generic [ref=e14]: "*"
        - generic [ref=e15]:
          - textbox "사용자 이름" [active] [ref=e16]
          - group:
            - generic: 사용자 이름 *
      - generic [ref=e17]:
        - generic:
          - text: 비밀번호
          - generic: "*"
        - generic [ref=e18]:
          - textbox "비밀번호" [ref=e19]
          - button "toggle password visibility" [ref=e21] [cursor=pointer]:
            - img [ref=e22]
          - group:
            - generic: 비밀번호 *
      - button "로그인" [ref=e24] [cursor=pointer]
  - generic [ref=e25]:
    - img [ref=e27]
    - button "Open Tanstack query devtools" [ref=e75] [cursor=pointer]:
      - img [ref=e76]
```