build: index.js
	bash ./modulize.sh

index.js: index.ts
	npx tsc index.ts
