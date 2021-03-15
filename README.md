# Mycology

## Values, Rules, and Constraints

On 3/12/2021, Cem Eskinazi and I met up to talk about a web project to compliment and accompany his forthcoming typeface, "Ray" (name to change). I'd spent the previous month or so messing around with an [interactive fluid simulator](https://github.com/nicschumann/fairly-fast-fluids) based on the energy and disposition of the typeface design – But we'd both independently arrived at a the conclusion that we wanted something more narrative, more engaging, and more game-y.

We made a list of constraints that we hope the project will satisfy. I'm reproducing that list here, because it's our jumping off point.

- Works on Desktop and Mobile equally well
  - *I question this a little bit with the direction the game is going, but let's see if we can do it.*
- Centers **one** interaction; simple.
- Short iteration and prototyping times
- "Ray" is the source material
- Type is the protagonist
- It's an infinite game (in the sense of [Carse](https://en.wikipedia.org/wiki/Finite_and_Infinite_Games))

"Ray" is a typeface with a psychedelic energy; the process of designing "Ray" was a visual and perceptual trip. We want to make an experience with takes the player on this perceptual trip using the motif of growing a garden of mushrooms, tending to the garden, harvesting spores, and progressively engaging with the increasingly hallucinatory aspects of "Ray". This gradual unwinding of the typeface's designspace as you play is the trip, which reflects our own trip in designing the typeface, and designing this experience. Through a combination of storytelling, a feedback loop of choices and an unfolding experienceof the type design, we hope to take the player on a trip that connects them with the sensibilities at the core of "Ray".

## Trip Levels

One layer of progression is the parts of the designspace and the character set that the player can see. Different glyphs have different degrees of psychedelia, and different styles of the typeface have different levels of psychedelia associated with them.

| Level 0 | Level 1 | Level 2 | Level 3 | Level 4 |
| - | - | - |  - | - |
| Georgia | Ray Regular| Ray Bold *or* Ray Light | Ray Black *or* Ray ExtraLight | Ray Ultra |

Different paths through this progress happen, depending on what you choose to do.


## Play

The "purpose" of the game is to collect as much of "Ray" (if you think of collecting "Ray" as collecting glyphs across weights) as you can over the course of play. The way you collect Ray is by growing and nurturing flowers, eating mushrooms, and keeping out weeds. It's just like real life!

There are three areas of play in the game, which you always have access to. An 8x8 grid called the `garden` is the primary area that you care for. Along side the garden, you have a `field guide`, a list of all the plants the player has encountered, as notes about what the player has in their garden (The number of "slots" in the field guide's inventory is a parameter to the game). The third and final area is the `log book`. The story of the garden unfolds in the logbook, where the main characters record their thoughts and experiences as you progress through the game. The log book also serves as a traditionally typeset proof of Ray.

You start with a random initial garden with some distribution of empty space, flowers, and weeds. It is guaranteed to contain one mushroom in a random cell.

The game consists of an infinite sequence of turns. During each turn, you transition through the following:

#### Player

You start your turn with a certain number of actions to spend (this is a parameter for the game. For this explanation, let's say it's 3 actions. Actions tightly correspond to clicks. For example, clicking a flower to pick it is an action. Clicking seeds in your inventory and then clicking on the garden to plant them is an action). You can click on squares in the grid. What happens depends on what you click on. There are a few different types of squares in the grid:

- `Mushrooms`
  - If you click on a garden square containing a mushroom, you harvest it, and it's removed from the garden and added to your field guide's inventory.
  - If you click an inventory square containing a mushroom, you eat the mushroom. This changes your perception of the world, which changes the way you see the mushrooms, flowers, and weeds in the garden. (basically, this is leveling up. This can also convert certain weeds into flowers, or flowers into weeds. Ideas and perspectives change).
  - If you wait and keep the mushroom in your inventory, after a certain number of turns it will rot and turn into `spores`.

- `Flowers`
  - If you click a garden square containing a flower, the flower is added to your inventory and removed from the garden grid. The number of flowers in your inventory (think of it as your flower vase c:) increases the number of clicks you can spend per turn.
  - If you click on an inventory square containing a flower, you harvest seeds from it. It's removed from your inventory, and replaced by `seeds`. Planting seeds increases the (high) likelyhood that flowers of the same sort will grow there).
  - If you wait and keep the flower in your inventiry, after a certain number of turns it will wilt and be removed from your inventory.


- `Weeds`
  - If you click a garden square containing weeds, you'll uproot and add them to your inventory, and remove it from the grid.
  - If you click an inventory square containing weeds, then you turn the weed into `compost` immediately.
  - If you wait and keep the weeds in your inventory, it will eventually decay into `compost`.


- `Spores`
  - Spores show up in your inventory if you let a mushroom rot instead of eating it. You can then plant the spores, and increase the likelihood of mushrooms growing in the garden square you click on by a little.
  - If wait and don't use the spores, they will decay and be removed from your inventory.


- `Seeds`
  - Seeds show up in your inventory if you harvest them from a flower. You can plant these seeds, and increase the likelihood that flowers will grow in that square by a lot!
  - Seeds never leave your inventory unless you plant them.


- `Compost`
  - Compost shows up in your inventory if you click on a weed, or if you wait for a while with the weed in your inventory. If you scatter compost over a garden square, then you increase all the likelihoods of things growing in proportion to their current likelihood.
  - If you wait and don't use the compost, it increases its potency.

#### Environment

After you've spent all your actions, it's the environment's turn to act. The environment's actions happen in two phases: First, each cell in the game transitions according to the current transition probabilities. Then, the transition probabilities are updated based on the new state of the garden grid.  Then, your inventory state is transitioned based on how long things have been there. Then, it's your turn again.

Each square in the garden can be in one of four states.

- `Empty`. If the square is empty, then it either becomes a flower, a mushroom, a weed, or nothing happens, depending on a discrete probability distribution assigned to that square. This distribution is unique for each square.

- `Flower`. If the square is a flower, then in its next state, it either becomes a bigger flower, or it doesn't grow. Flowers increase the likelihood of a mushroom  to grow in a neighboring empty squares.

- `Mushroom`. If the square is a mushroom, then in its next state, it either becomes a bigger mushroom, or decays. If the mushroom is next to a flower, it's likelyhood of getting bigger increases.

- `Weeds`. If a square is a weed, then it grows with probability 1. In addition, it increases the likelyhood of weeds in adjacent empty cells, decreases the likelyhood of growth in neighboring cells mushroom and flower cells (for flowers, it prevents further growth, for mushrooms it increases likelihood of decay.).

Transitions can be represented as a grid. Each cell has a list of numbers, that corresponds to a table of multipliers for the cell's transition matrix.

- For `Empty` cells, the list `x, y, z` corresponds to the probabilities that the cell transitions to a flower, mushroom, or weeds, respectively. The probability that the cell remains empty is `1 - x - y - z`.
- For `Flowers`, the number `x` corresponds to the probability that the flower will grow, rather than stay the same.
- For `Mushrooms`, the number `x` represents the probability that the mushroom will grow, rather than decay.
- For `Weeds`, the number `x` represents the probability that the weed will grow.

In theory, each unique flower, weed, or mushroom could have it's own transition matrix, which would interact in different ways. This is how we could change the game dynamics depending on what's on the board.

|   | Empty | Flower | Mushroom | Weeds |
| - | - | - | - | - |
| **Empty** | 1, 1, 1 | 1 | 1 | 1 |
| **Flower** | 1, 1.5, 1 | 1.1 | 1  | 0.8 |
| **Mushroom** | 1, 1, 1 | 1 | 1.1 | 1 |
| **Weeds** | 0.8, 0.8, 1.2 | 0.8 | 0.8 | 1 |

*This table is an example transition table update for each cell in the game according to its neighbors. These numbers are, obviously, tunable parameters.*

Your inventory state is pretty simple. Each item has a lifespan (with the exception of seeds, and compost), and the lifespan is decremented. If a lifespan hits zero, the item is transformed into its next state, or removed from your inventory if it has no next state.

#### Narrative

Narrative elements are revealed as you reach different states of the garden and inventory. Whenever a state is changed, the narrative flow is checked and new entries are added as relevant. Max one entry per action.

#### Endgame

You "win" when the garden is full of flowers. However, you can keep playing indefinitely, because you can pick flowers and create new space in the garden. keep playing as you choose. However, if you don't interact and the garden is full of flowers, it will grow indefinitely. Keep your browser open!

You lose if the garden is full of weeds, and you don't have any seeds, because then there's no way to grow mushrooms or flowers. Of course, you could try and get lucky, by picking weeds and hoping a flower grows, but that's ... pretty hard. There's always a chance though, so technically, you can't ever lose.
