# Хөгжүүлэлтийн журам

1. Existing branch ба local өөрчлөлтийг `git status`-аар шалга.
2. Шинэ task branch үүсгэж тухайн урсгалын service/component-ийг эхэлж унш.
3. Одоо байгаа `components/ui/` болон validation/helper-ийг дахин ашигла.
4. Монгол/англи текст, dark/light, responsive, focus/disabled/error төлөвийг хамтад нь тооц.
5. Эрсдэлтэй логикт behavior тест нэм; `typecheck`, `lint`, `test`, шаардлагатай build/E2E-г ажиллуул.
6. SQL өөрчлөлтөд dependency, rollback/compatibility, staging үр дүнг баримтжуул.
7. PR-д шалтгаан, өөрчлөлт, шалгалт, үлдсэн хязгаарлалтыг бич.

`AGENTS.md` дахь Next.js хувилбарын зааврыг дагана. Нууц env, backup, build cache-ийг commit хийхгүй. Шинэ feature нь deploy болсон гэсэн утгатай биш; [STATUS](docs/STATUS.md)-д нотолгоотой шинэчилнэ.
