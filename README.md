# 결정 구조 · Miller 지수 시각화 (FCC / BCC / HCP / Simple Cubic)

단위세포에서 **면 (hkl)** 과 **방향 [uvw]** 를 2D·3D로 시각화하는 결정학 학습 사이트.

### 🔗 Live
- 시각화: https://mureds.github.io/crystal_basics/
- 설명: https://mureds.github.io/crystal_basics/guide.html

## 구성
- `index.html` — 3D 단위세포 + (hkl) 면(절편) + [uvw] 화살표 / 2D 면 정면 원자배열
- `guide.html` — Miller 지수(면·방향) 기초
- `js/xtal.js` 엔진(격자·역격자 면법선·면-셀 교차) · `view3d.js`(three.js) · `view2d.js` · `main.js`
