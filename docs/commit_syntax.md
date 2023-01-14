# Commit Syntax
This is an opinionated guide on how to construct a commit message for this repository. The rules outlined in this guide are **not** optional and must be upheld in order to maintain consistency. As you'll learn, this also reduces the mental overhead when reading commit messages.

## Commit Strategies
When browsing other repositories, you'll notice many commit strategies that other Devs are using; not all strategies, however, are created equal. We're going to go over the predominate `3` that I've personally noticed when browsing some top repositories on GitHub.

### Minimalist
This is simply an action followed by a description; no special syntax required, just short and sweet. In a lot of cases, this approach is great, because it ensures the reader knows exactly what the commit is doing...however, you will inevitably lose context in the process of minification.

Let's take the example of `remove obsolete character attributes`. We know immediately what the commit is doing and why it's doing it. The problem is, we don't know "where" it's doing it.

*Character* is a bit of an ambiguous term here, because throughout our code, we could have multiple references to a *Character*, whether that be strings, objects, or logic.

Best case scenario would be to give context for *Character* instead of needing to open the commit and look at the files being changed.

Some might say that I'm splitting hairs here, but let's continue...

### Verbose
This strategy can end up being a nightmare, because it's information overload in a message that, by its very nature, should be *to-the-point*. Writing, what essentially amounts to a small paragraph, is entirely unnecessary as the main message of a commit.

Let me add that putting a paragraph within the **body** of a commit, has it's use-cases, but it should *not* be the main message itself.

Verbosity should be reserved for the body of a commit, and only when it's absolutely necessary to describe some kind of design/engineering issue/choice which would otherwise not be obvious, even from the code itself.

### Contextual
This is the strategy we're going to be using. Not only does it maintain the minimalist philosophy of a concise message, but it also adds a bit of contextual sugar, along with allowing extra content to be laid out in the body of a commit. In order to maintain readability, we're also limiting what actions are valid.

The syntax for this is as follows, and notice that we're expounding on the example above: `fix(char_props): remove obsolete attributes`
- If we're familiar with the code-base at all, we'll immediately know where this change occurred. Even if we're *not* familiar with it, we now know where to look for the change.
- Notice that we have an even greater context with `fix` as the action, instead of `remove`. There's a good chance the reader had no idea this was a `fix`, it could have just as easily been a `chore`.

With this strategy, we define clear actions which convey specific intent and context to our commit; this doesn't always come across using the other strategies.

The reason I've chosen to limit the allowed actions, is because it forces a Dev to think about what the commit is supposed to be conveying in a more concise manner. The minimalist approach allows any word to be used as an action, but that can lead to confusion if multiple Devs are using different actions to convey the same idea throughout a project.

Last but not least, when commit messages can be read almost like change-logs, we can scrape our `git log` and create a document of changes based on their actions within each of their contexts.
- The ideas expressed in this document were inspired because of my new git log prettyfier utility: [Gilmer](https://github.com/Jaeiya/gilmer).


## Why?
If we don't unify the way a commit is structured, then we run the risk of "*too many cooks in the kitchen*". Each person is capable of describing a change they've made to the code-base, but they will use their own verbiage that makes sense to them and that can create confusion.

Having a commit paradigm, already in place, will allow contributors to immediately start creating consistent and sensible commits.

## Syntax
```bash
# Bad
action description
description

# Good
action: description

# Very Good
action(subject): description
```
### Action
Should be one of the **allowed** actions listed at the bottom of this document. It's a single word which lets the reader know what's happening: *fix*, *clean*, *feat*, etc... An action like *feat* may not look like an action, but it's referring to the action: *created new feature or functionality*. Obviously, it would be silly to type out that whole line, so we just say *feat* for short, and it's not the only word which implies an action.

### Subject
Should be the specific context that the **action** is being applied to. This is usually a *file* or *class* name, but can also be a prolific *concept* or *function* within the code-base.

## Examples
```bash
# Bad
fix: changed color from yellow to red

# Okay
fix: emphasize error text with red
fix: error text should be red

# Excellent
fix: not enough emphasis on error text
```
As you can see from the array of "good" examples, that context is more important than what the code is actually doing. The **why** for a commit should always take precedence over what the code inside a commit is actually doing, unless what a commit is doing, is the context itself.

If we examine all 3 acceptable examples, you'll notice that the *Excellent* one not only fulfills the reason for the fix (emphasizing error text) but also **why** it's a *fix*. From the 2 *Okay* examples, it's kind of hard to tell that they are *fixes*, versus just changes to CSS.

- `emphasize error text with red` - Was that the original intent? Is the implication that we're fixing it to fit its original intent, or was the original intent not accurate enough, so we're modifying it further? Is this a fix or a CSS modification? Even though this is a clear and concise description, it can leave us asking too many questions.
- `error text should be red` - Now we know that the text probably should've been **red** all along, but with a lingering thought of "was it supposed to be *red*, or did they just decide that it should've been, after testing?" If this lingering thought is accurate, then it's not actually a fix, it's a CSS modification.
- `not enough emphasis on error text` - With this commit, not only do we know that we're emphasizing text, but also that a lack of emphasis is a problem that wasn't solved with the original intent of the code. The reader may not know that we emphasized it with Red, but that doesn't matter because emphasis is the problem being solved. If we want to see what *"emphasis"* looks like, we can just look at the **code-diff**.

So even if a commit message follows the syntax and basic guidelines, it still may not fully convey its intent. Now obviously, if a commit is marked as a *fix*, we can safely assume that's the intent, but making sure a commit is created with as little ambiguity as possible, is the best case scenario. If I'm only left with one question after reading a commit, it's a good commit.

Of course that question is: "What does the code look like?" because after a good commit, that's the only acceptable unknown.


## Requirements and Restrictions
All commit messages must contain an *action*, followed by a *colon*, followed by a *description*: `action: description`.

If a commit requires greater context, then an *action* can be supplied with a *subject*, wrapped in *parentheses*, followed by a *colon*, followed by a *description*: `action(subject): description`
> A commit can never be formatted any other way than what has been described above...**unless** a pull request is merged.

### Allowed Actions
#### Feature
**Code:** `feat`
New functionality. Any code changes that add functionality; it's really that simple.

#### Fix
**Code:** `fix`
This can be a bit ambiguous, since sometimes you may want to fix code that can fall under another *action*. For instance, fixing a typo in a document, is that a `docs` or `fix` action?
> If an action already exists, but you're applying a fix, always use the existing action: `docs(document): fix typo` 
> 
> We do this so that when we scrape our git logs into a change log, all of that action's changes will be under the same context.

#### Universal Change
**Code:** `chg`
A change that does not fall under any other **allowed** actions. This action should almost always come with body text, which describes why the change was necessary.

#### Clean Code
**Code:** `clean`
Anything that pertains to clean code practices: refactoring, re-structuring, renaming, reducing/improving logic, white-space changes, etc...
> As long as refactor or logic adjustments do not change the functionality of the code, then they can be considered a `clean` action. However, if a refactor results in a bug being fixed or improvements being made, then you would use the appropriate *action*.

#### Test Driven Development
**Code:** `tdd`
This one is a bit of a counter-intuitive one. This Action doesn't mean that the commit is explicitly referring to the strategy of *Test Driven Development*, but that the commit itself is test-driven; in other words, the commit is pointing to a modification pertaining to the testing paradigm of the project.
> This action is for any changes that involve unit tests, mock files, or fixtures. **Any** modifications related to the testing paradigm of the project. The action `tdd` is just a catch-all, for development driven by **any** testing paradigm.

#### Documentation
**Code:** `docs`
When updating, clarifying, adding, or fixing documentation. This action should always use the document name as the subject, like so: `docs(readme): fix typo`.

#### Chores
**Code:** `chore`
Something that must be done out of necessity: updating, fixing, adding, or deleting dependencies, moving, deleting, or renaming files, updating versions, etc...
> This includes changes that may seem to fall under other actions, such as moving a document from one folder to another; that still falls under the chore action.

#### CSS Changes
**Code:** `css`
Cascading Style Sheet changes, but only when CSS is the only code being changed, otherwise it's probably best to use a different action. Again, as stated earlier under `fix`, if you fix a CSS-only bug, it should go under the `css` action.

### Deprecated Actions
#### Add
**Codes:** `add`,  `new`
Now falls under [Feature](#feature)
#### Update
**Codes:** `update`, `upd`
Now falls under [Universal Change](#universal-change)
#### Refactor
**Codes:** `rename`, `refactor`
Now falls under [Clean Code](#clean-code)
#### Remove
**Codes:** `remove`, `delete`, `del`, `move`
Now falls under [Clean Code](#clean-code) or [Chores](#chores)
#### Test
**Codes:** `test`
Now falls under [Test Driven Development](#test-driven-development)
#### WIP
**Codes:** `wip`
Work in progress should stay local until finished, at which point the commits can be combined into a single feature, fix, or change