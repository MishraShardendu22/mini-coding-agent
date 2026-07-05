# Mini Coding Agent

## Time Spent

| Task                                                                                                                    | Time    |
| ----------------------------------------------------------------------------------------------------------------------- | ------- |
| Learning about Skills, reading documentation, and exploring examples from https://github.com/CommandCodeAI/agent-skills | 6 hours |
| System design and implementation                                                                                        | 2 hours |
| Testing, debugging, and improving the system                                                                            | 3 hours |
| Refactoring                                                                                                             | 1 hour  |

## Sample .env

```
MODEL=
API_KEY=
AGENT_MODEL=
ROUTER_MODEL=
```

## How to run the CLI tool

```bash
npm install && npm start
```

## Challenges

### 1. Understanding Skills

I had never heard of Skills before, so I had to learn about them.

* I read the documentation at https://agentskills.io/home.
* I also used AI to help me understand the documentation.
* The most useful resource was the https://github.com/CommandCodeAI/agent-skills repository.
* I went through several examples myself, then downloaded the repository and, with the help of AI, understood how Skills work and how to use them properly.

### 2. Deciding which Skills to add

I wanted to add something that is actually useful in open source, as I am an open source contributor myself.

* I added a Skill for contribution guidelines because many open source projects require contributors to follow guidelines such as DCO before merging PRs.
* I also created a PR Judge Skill that evaluates a PR based on factors such as the value it adds, how well it solves the issue, and other important aspects.
* Basically, a code base might have a very specific way of coding in it's, codebase, eg There frontend codebase could be super strict on being Atomic Design based, there backend could be super strict on having classes (like in java) or Model-View-Controller (MVC) architectural pattern so many OS projects want pr and design according to their codebase 
* I created utilities that extract metadata between `---` and `---` using regex and load that information into the LLM along with the user's query to determine which Skill or Skills should be used.
* Writing the Skills, their documentation, and loading them was straightforward.
* The main design decision was caching. In a long-running conversation, there is no point in loading the same Skill repeatedly, so once a Skill is loaded, it is cached in memory.

### 3. Working with free LLMs

I was using free LLMs because I did not have a credit card.

* The biggest problem I faced was rate limiting.
* I realized that determining which Skill to use is a much simpler task than generating the final response.
* So, I configured two models:
  * A smaller model to determine which Skill or Skills should be used.
  * A larger model to generate the final response.
* In production, this could be something like using Haiku for Skill selection and Sonnet or Opus for the final response.

## Interesting parts

1. * Learning about Skills was interesting because I had never worked with them before.
2. * It was not explicitly mentioned, but it seemed logical that a single query could require multiple Skills, so I implemented support for multiple Skills.
3. * Designing the two-model pipeline and deciding how to split the workload between the models was interesting.
4. * Deciding how Skills should be loaded and cached was an interesting design problem.
5. * Thinking about future improvements was also interesting:
6. * Adding tool calling would significantly improve the system because Skills handle context management while tools can retrieve additional information and perform actions.
    - For example, I could use Git commands through tool calling to get the difference between specific commits and use that information to judge a PR.
    - I could also use tools to gather additional data for responses and perform specific actions when required.