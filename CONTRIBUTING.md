# Хөгжүүлэлтийн журам

1. Салбарын commit-ийг `git log -1 --oneline`-аар шалга. Өөрчилсөн файлыг `git ls-files -m`, шинэ файлыг `git ls-files --others --exclude-standard`-аар жагсаа.
2. Шинэ task branch үүсгэж тухайн урсгалын service/component-ийг эхэлж унш.
3. Одоо байгаа `components/ui/` болон validation/helper-ийг дахин ашигла.
4. Монгол/англи текст, dark/light, responsive, focus/disabled/error төлөвийг хамтад нь тооц.
5. Эрсдэлтэй логикт behavior тест нэм; `typecheck`, `lint`, `test`, шаардлагатай build/E2E-г ажиллуул.
6. SQL өөрчлөлтөд dependency, rollback/compatibility, staging үр дүнг баримтжуул.
7. PR-д шалтгаан, өөрчлөлт, шалгалт, үлдсэн хязгаарлалтыг бич.

[`AGENTS.md`](AGENTS.md) дахь Next.js болон migration зааврыг дагана. Нууц env, backup, build cache-ийг commit хийхгүй. Deploy-ийн үр дүнг [release шалгалтаар](docs/DEPLOYMENT.md) баталгаажуулна.
