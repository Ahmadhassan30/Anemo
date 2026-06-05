## Project Proposal Artificial Intelligence 

## agentic-framwork-for-lecture-to-animation 

An Agentic Al Platform for Transforming Raw Lectures into Animated Educational Videos 

## Contents 

|1|IdeaOrigin|||2|
|---|---|---|---|---|
|2|ProjectDescription|||2|
|3|Problem Statement&Impact|||2|
||3.1<br>Problem Statement ..................|2020220200005||2|
||3.2<br>Societal Impact .... 2...0.<br>ee|||3|
|4|Competitive Analysis|||3|
|5|SystemArchitecture|||3|
||5.1<br>High~~-L~~evel Architecture<br>2...2...<br>es|||4|
||5.2<br>Agentic Pipeline Detail... ........2......2.<br>0.020 0000.|||4|
|6|Database Design|||5|
||6.1<br>Entity~~-~~Relationship Diagram... ..........0.|2.0002|ee eee|5|
||6.2<br>Schema Overview .......... 2.0. eee||ee|5|
|7|UML Class Diagram|||6|
|8|Sequence Diagram~~— ~~Core Pipeline|||7|
|9|TechnologyStack|||8|
|10Research|Researchvs. IndustryClassification|||9|
|11|ProjectTimeline|||9|
|12Expected|ExpectedOutcomes|||9|



1 

~~LectureOS~~ 

~~Project Proposal: Artificial Intelligence~~ 

## 1. Idea Origin 

During one of his lectures, our professor casually mentioned that he plans to spend his summer recording his course material so that students beyond this classroom, across the country and around the world, could benefit from his teaching. That single remark stayed with us. We have seen firsthand how clearly, he explains concepts that most textbooks struggle to convey, and the thought of that knowledge being confined to four walls felt like a profound waste. At the same time, we knew that turning raw recordings into polished, engaging YouTube content demands hours of editing, thumbnail design, SEO optimisation, and visualisation work that no busy academic should have to do alone. That evening we asked ourselves: what ifan AI system could take his recording and handle everything else, producing a publication ready animated educational video with zero manual effort on his part? LectureOS is our answer to that question, and our humble way of ensuring that his teaching reaches every student who deserves to hear it. 

## 2. Project Description 

LectureOS is an agentic AI platform that accepts a raw lecture video recorded by a professor and autonomously transforms it into a polished, 3Bluel1Brown- ~~s~~ tyle animated educational video. The system transcribes the lecture using OpenAI Whisper (supporting mixed Urdu ~~—E~~ nglish code ~~-~~ switched speech common in Pakistani academia), extracts discrete conceptual segments using a large language model, generates Manim animation code per concept, renders each scene, and re ~~-~~ synchronises the professor’s original voice over the final composited video. 

The platform exposes two interfaces: a Professor Portal where educators upload recordings and monitor the agentic pipeline in real time via Server ~~-~~ Sent Events (SSE), and a Student Portal where enrolled students access the produced videos, auto ~~-~~ generated notes, quizzes, and a Retrieva ~~l~~ -Augmented Generation (RAG) chatbot grounded in the professor’s own words with timestamp ~~-l~~ inked citations. 

Unlike existing tools (Panopto, Synthesia, Pictory) which either store raw recordings passively or require a pre ~~-~~ written script, LectureOS is the only system that takes unedited, code ~~-~~ switched speech and produces a 3Blue1Brown- ~~q~~ uality animated video end ~~-~~ t ~~o-~~ end without any human post ~~-~~ production. 

## 3. Problem Statement & Impact 

## 3.1. Problem Statement 

A professor with deep domain expertise faces three compounding barriers when attempting to build a public YouTube presence: 

1. Post ~~-~~ production overhead: Editing, captioning, thumbnail design, SEO metadata, and consistent publishing require creator skills that academics have neither the time nor training to acquire. 

2. Visualisation gap: Raw talkin ~~g-~~ head lectures have low retention on YouTube (<40% average watch time). High ~~-r~~ etention academic channels (3Bluel Brown, Numberphile) succeed because complex concepts are animate ~~d—a~~ skill requiring 20+ hours per 5 ~~-~~ minute video using Manim. 

2 

~~LectureOS~~ 

~~Project Proposal: Artificial Intelligence~~ 

3. Code ~~-s~~ witching in local academia: Pakistani professors naturally switch between Urdu and English mid- ~~l~~ ecture. No existing lecture platform handles this gracefully, causing transcription failures in downstream tools. 

## 3.2. Societal Impact 

- Knowledge democratisation: Expert academic content currently locked behind enrollment reaches global learners for free via YouTube, compressing the knowledge gap between elite and public universities. 

- Time reduction: A process requiring 1 ~~5—~~ 20 hours of post ~~-~~ production per lecture is reduced to a one ~~-c~~ lick upload, saving faculty an estimated 200+ hours per academic year. 

- © Educational quality: Animated visualisations increase concept retention by up to 40% compared to raw video lectures [1]. 

- Local language inclusion: Native Urdu ~~-E~~ nglish code ~~-~~ switching support ensures Pakistani academic content is accurately processed, reducing the language barrier for both content creators and learners. 

## 4. Competitive Analysis 

Table |: Feature comparison of LectureOS against existing platforms. 

|Feature|Panopto|Synthesia|Pictory||Mindgrasp|ManimatorLectureOS|LectureOS|
|---|---|---|---|---|---|---|
|Rawvideoupload|JV|JV|V|JV|x|A|
|Urdu~~-—E~~nglish|x|x|x|x|x|JV|
|code~~-~~switch|||||||
|3BlueiBrown-~~s~~tyle|x|x|x|x|Ni|JV|
|animation|||||||
|Zero~~-~~touch pipeline|x|x|x|x|x|J|
|Auto YouTube|x|x|x|x|x|Vv|
|publishing|||||||
|StudentRAG|x|x|x|Partial|x|JV|
|chatbot|||||||
|Timestamp~~-l~~inked|Partial|x|x|x|x|JV|
|answers|||||||
|Autoquizgeneration|x|x|x|V|x|V|
|Open~~-s~~ourceLLM|x|x|x|x|Partial|JV|
|stack|||||||
|SSEliveprogress|x|x|x|x|x|J|



## 5. System Architecture 

3 

~~LectureOS~~ 

~~Project Proposal: Artificial Intelligence~~ 

## 5.1. High ~~-L~~ evel Architecture 

Figure | presents the end ~~-~~ t ~~o-~~ end agentic pipeline. Each red ~~-~~ bordered node is an au ~~-~~ tonomous agent with its own tool set and retry logic. 

**==> picture [219 x 287] intentionally omitted <==**

**----- Start of picture text -----**<br>
Professor hae Object<br>Upload Portal “Storage (S3)<br>trigger<br>WhisperAgent 1 v3 tre psf.-LM-GonceptABE it 2<br>Transcription Segmentation<br>Mh amnidism Code Manim<br>Generation Render<br>Agent 6 ildexed Ag ent 5 final. mp4 Agent 7<br>RAG Video YouTube<br>Indexing Composition Publish<br>pgvector<br>Student Professor<br>Portal Dashboard<br>**----- End of picture text -----**<br>


Figure 1: LectureOS end ~~-~~ t ~~o-~~ end agentic pipeline. 

## 5.2. Agentic Pipeline Detail 

## Pipeline: Upload — Animated Video 

1. Ingest Agent ~~—~~ validates upload, extracts audio track, pushes to queue. 

2. Transcription Agent ~~—~~ runs _§fast ~~er~~ -whisper large ~~-~~ v3 with language=None enabling automatic Urdu/English detection; outputs times ~~-~~ tamped JSON segments. 

3. Concept Segmentation Agent ~~—~~ LLM reads full transcript; outputs a structured JSON array of {concept, timestamp start, timestamp end, visual_type} tuples. 

4. Manim Code Generation Agent ~~—~~ for each concept, generates a Manim Scene class via a Planner—-Coder—Critic pattern; failed renders trigger auto ~~-~~ matic retry with error context (up to 5 attempts). 

5. Render Agent ~~—~~ executes manim render per scene; collects MP4 clips. 

6. Composition Agent ~~—~~ concatenates clips, overlays professor’s original voice (time ~~-~~ aligned to segments), adds captions, exports final video. 

4 

~~LectureOS~~ 

~~Project Proposal: Artificial Intelligence~~ 

7. RAG Indexing Agent ~~—~~ chunks transcript by concept, embeds with BAAI/bge- ~~sm~~ all- ~~e~~ n- ~~v~~ 1.5, upserts into pgvector with {lecture_id, timestamp, concept} metadata. 

8. Publish Agent ~~—~~ uploads final video to YouTube via Data API v3 with LLM ~~-~~ generated SEO title, description, and chapters; sends professor a completion report. 

## 6._ ~~Database Design~~ 

6.1. Entit ~~y-~~ Relationship Diagram 

**==> picture [414 x 394] intentionally omitted <==**

**----- Start of picture text -----**<br>
User re, Concept<br>email : varchar creates 1."FKBx professor_id:lecture_id: uuiduuid has 1..’ FK lectur e_i d: uuid<br>role: enum(prof,student) title: varchar title : varchar<br>created_at : timestamptz raw_video_url: text t s_s tart : float<br>status: enum t s_ end: float<br>youtube_url: text manim _co de: text<br>created_at : timestamptz cli p_u rl: text<br>generates 1..* embeds 1..*<br>Embedding<br>ri<br>FK lecture_id: uuid FK concep t_i d: uuid<br>question : text vector : vector(384)<br>choices: jsonb chunk _t ext: text<br>answer: varchar<br>Figure 2: Entity - Relationship Diagram for LectureOS PostgreSQL schema.<br>Schema Overview<br>Table 2: Core database tables and their primary responsibilities.<br>Table Purpose Engine<br>users Authentication, role management (professor / student) PostgreSQL<br>lectures Lecture metadata, status tracking, YouTube URL PostgreSQL<br>concepts Segmented concepts, Manim code, rendered clip URLs PostgreSQL<br>embeddings Vector embeddings for RAG retrieval pgvector<br>quizzes LLM- g enerated MCQs per lecture PostgreSQL<br>agent runs Audit log of every agent invocation and retry PostgreSQL<br>**----- End of picture text -----**<br>


## 6.2. Schema Overview 

## 7. UML Class Diagram 

5 

~~LectureOS~~ 

~~Project Proposal: Artificial Intelligence~~ 

**==> picture [328 x 267] intentionally omitted <==**

**----- Start of picture text -----**<br>
Professor \ ((abstract)) User / Student<br>+ uploadLecture(): void. - email: String - enrollments: List .<br>+ approvePipeline():— void. - role: Role- - + askChatbot(): String<br>+ authenticate(): void<br>0<br>Lecture Co AgentOrchestrator<br>Y<br>- lectureld: UUID - conceptid: UUID - agents: List<Agent><br>- status: PipelineStatus - title: String - maxRetries: Int<br>- rawVideoUrl: String a - tsStart: Float + run(lectureld): void<br>- youtubeUrl: String - manimCode: String + onAgentFail(): void<br>+ triggerPipeline(): void + renderScene(): void + streamProgress(): void<br>RAGService<br>- vectorStore: PGVector<br>+ embed(chunk): void<br>+ retrieve(query): List<br>+ answerWithCitation():<br>String<br>**----- End of picture text -----**<br>


Figure 3: UML Class Diagram showing core domain model and key associations. 

## 8. Sequence Diagram ~~—~~ Core Pipeline 

6 

~~LectureOS~~ 

~~Project Proposal: Artificial Intelligence~~ 

**==> picture [338 x 266] intentionally omitted <==**

**----- Start of picture text -----**<br>
upload video<br>enqueue job<br>audio + lang=None<br>segment transcript<br>gen Manim code (<N)<br>retry <5<br>on render<br>render scene fail<br>compose + voice syne<br>upload + SEO meta<br>**----- End of picture text -----**<br>


Figure 4: UML Sequence Diagram for the lectur ~~e-~~ t ~~o-~~ video pipeline. Dashed arrows indicate return messages. 

## 9. Technology Stack 

7 

LectureOS 

Project Proposal: Artificial Intelligence 

Table 3: Full technology stack for LectureOS. 

|Layer|Technology|Rationale|
|---|---|---|
||Next.js 15 (App Router)|SSR, streaming UI, SSE support|
|Frontend|TailwindCSS + shadcn/ui|Rapid, consistent component library|
||Zustand|Lightweight global state forpipeline sta~~-~~|
|||tus|
||FastAPI (Python)|Async-~~n~~ative; ideal for agent orchestra~~-~~|
|||tion|
|Backend|Celery+Redis|Distributedtaskqueue forlong~~-~~running|
|||agent jobs|
||PostgreSQL +pgvector|Relational + vector search in one engine|
||SSE (Server~~-~~Sent Events)|Real~~-~~timepipelineprogress streamingto|
|||professor|
||faste~~r-~~whisper large~~-~~v3|Open-~~s~~ource;<br>handles<br>Urdu~~—E~~nglish|
|||code~~-s~~witching|
|AI/ML|DeepSeek~~-~~V3 API|Manim code generation;<br>best price~~-t~~o~~-~~|
|||quality ratio|
||Qwen2.5~~-~~Coder~~-~~32B (local)|Runs on RTX 3070 (4~~-b~~it); offline con~~-~~|
|||cept segmentation|
||Manim Community Edition|3BluelBrown-~~s~~tyle animation rendering|
|||engine|
||BAAI/bge-~~s~~mall-~~e~~n~~-v~~1.5|Sentence embeddings for RAG (runs lo~~-~~|
|||cally, 384~~-~~dim)|
||AWS S3|Rawvideo and rendered clip storage|
|Infrastructure|YouTube DataAPI v3|Automated publishing with OAuth2|
||Vercel(frontend)|Edge~~-d~~eployedNext.jsfrontend|



## 10. Research vs. Industry Classification 

8 

~~LectureOS~~ 

~~Project Proposal: Artificial Intelligence~~ 

## Classification: Industry Project (with Research Components) 

LectureOS is primarily an industry project, targeting deployment as a produc ~~-~~ tion SaaS platform for universities and independent educators. The deliverable is a working, demonstrable produc ~~t—n~~ ot a theoretical system. However, two embedded research components justify academic publication potential: 

1. Code ~~-s~~ witched Urdu ~~—E~~ nglish lecture transcription: Evaluating and fine ~~-~~ tuning Whisper larg ~~e-~~ v3 for Pakistani academic audi ~~o—a~~ domain with no pub ~~-~~ lished benchmarks ~~—co~~ nstitutes an original empirical contribution suitable for a short paper at an NLP venue. 

2. Transcrip ~~t-~~ t ~~o~~ -Manim pipeline evaluation: Benchmarking open ~~-s~~ ource LLMs (DeepSeek ~~-~~ V3, Qwen2.5 ~~-C~~ oder) on Manim code generation from nat ~~-~~ ural language lecture transcripts, using TheoremExplainBench [2] as evaluation protocol, is a publishable systems contribution. 

## 11. Project Timeline 

Table 4: Fou ~~r-~~ week development sprint plan. 

|Week|Focus||Deliverables|
|---|---|---|---|
|1|Foundation||DB schema, FastAPI skeleton, authentication (profes~~-~~|
||||sor/student roles), raw video upload to $3, Whisper|
||||transcription agent working end~~-t~~o~~-~~end, Next.js portal|
||||shell.|
|2|Core AI Pipeline||Concept segmentation agent, Manim code generation|
||||with Planner—Coder—Critic pattern and retry loop,|
||||Manim render agent, SSE progress stream to professor|
||||dashboard.|
|3|Composition|& RAG|Video<br>composition<br>agent<br>(ffmpeg),<br>voice<br>re~~-~~sync,|
||||YouTube<br>publish<br>agent<br>(OAuth2), RAG<br>indexing|
||||pipeline,<br>student chatbot with timestamp~~-l~~inked<br>ci~~-~~|
||||tations.|
|4|Polish & Demo||Auto quiz generation, professor analytics, end~~-~~t~~o-~~end|
||||integration testing on real professor lecture, demo video,|
||||projectreport.|



## 12. 

## Expected Outcomes 

1. A fully functional web application accessible at a public URL, processing real lecture uploads from the supervising professor. 

2. Reduction of post ~~-~~ production time from an estimated 1 ~~5—~~ 20 hours to under 15 minutes per lecture. 

9 

~~LectureOS~~ 

~~Project Proposal: Artificial Intelligence~~ 

3. A 3BluelBrown- ~~s~~ tyle animated video produced from a mixed Urdu ~~—E~~ nglish lecture with zero human editing. 

4. A student portal with RAG chatbot providing timestamp ~~-c~~ ited answers sourced from lecture transcripts. 

5. Empirical evaluation results comparing open ~~-s~~ ource LLMs on Manim code generation from lecture transcripts. 

## References 

- [1] Mayer, R. E. (2009). Multimedia Learning (2nd ed.). Cambridge University Press. 

- [2] Ku, M., Chong, T., Leung, J., Shah, K., Yu, A., & Chen, W. (2025). TheoremExplainA ~~-~~ gent: Towards video ~~-~~ based multimodal explanations for LLM theorem understanding. arXiv preprint arXiv:2501.09025. 

- [3] Jain, V., et al. (2025). Manimator: Transforming research papers into visual explana ~~-~~ tions. arXiv preprint arXiv:2507.14306. 

- [4] Radford, A., Kim, J. W., Xu, T., Brockman, G., McLeavey, C., & Sutskever, I. (2022). Robust speech recognition via large ~~-~~ scale weak supervision. arXiv preprint arXiv: 2212.04356. 

- [5] DeepSeek ~~-A~~ I. (2024). DeepSeek ~~-~~ V3 Technical Report. arXiv preprint arXiv: 2412.19437. 

10 

