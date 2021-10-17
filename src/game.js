require('./main.css');
import m from 'mithril';

const CELL_TYPE_EMPTY = 'empty';
const CELL_TYPE_MUSHROOM = 'shroom';
const CELL_TYPE_FLOWER = 'flower';
const CELL_TYPE_WEED = 'weed';
const CELL_TYPE_SEEDS = 'seeds';
const CELL_TYPE_SPORES = 'spores';
const CELL_TYPE_COMPOST = 'compost';

const CELL_TYPES = [
  CELL_TYPE_EMPTY,
  CELL_TYPE_MUSHROOM,
  CELL_TYPE_FLOWER,
  CELL_TYPE_WEED,
  CELL_TYPE_SEEDS,
  CELL_TYPE_SPORES,
  CELL_TYPE_COMPOST
];

const CELL_INDICES = {
  [CELL_TYPE_EMPTY]: 0,
  [CELL_TYPE_MUSHROOM]: 1,
  [CELL_TYPE_FLOWER]: 2,
  [CELL_TYPE_WEED]: 3,
  [CELL_TYPE_SEEDS]: 4,
  [CELL_TYPE_SPORES]: 5,
  [CELL_TYPE_COMPOST]: 6
};

const ACTION_TYPE_NONE = 'none';
const ACTION_TYPE_CARRYING_GARDEN_CELL = 'carrying_garden_cell';
const ACTION_TYPE_CARRYING_INVENTORY_CELL = 'carrying_inventory_cell';

function sample_to_garden_cell(type_index)
{
  return [
    empty_garden_cell,
    mushroom_garden_cell,
    flower_garden_cell,
    weed_garden_cell,
    seeds_garden_cell,
    spores_garden_cell,
    compost_garden_cell
  ][type_index];
}

function sample_to_inventory_cell(type_index)
{
  return [
    empty_inventory_cell,
    mushroom_inventory_cell,
    flower_inventory_cell,
    weed_inventory_cell,
    seeds_inventory_cell,
    spores_inventory_cell,
    compost_inventory_cell
  ][type_index];
}



// Entity Actions

function empty_garden_cell_action(cell, parameters, state, render)
{
  if (
    state.action.remaining > 0 &&
    state.action.type == ACTION_TYPE_NONE
  ) {
    state.action.remaining -= 1;
  }

  if (
    state.action.remaining > 0 &&
    (state.action.type == ACTION_TYPE_CARRYING_GARDEN_CELL  ||
     state.action.type == ACTION_TYPE_CARRYING_INVENTORY_CELL)
  ) {
    let [i, j] = cell.index;
    let entity_function = sample_to_garden_cell(CELL_INDICES[state.action.cell.type]);
    state.garden.cells[i][j] = entity_function(cell.index, parameters, state);

    // maybe we should also process an immediate effect here, too?
    // if it's an inventory cell? or both, even?

    state.garden.cells[i][j].entity = state.action.cell.entity;
    state.action.type = ACTION_TYPE_NONE;
    state.action.remaining -= 1;
  }

  if (state.action.remaining < 1)
  {
    step_garden_state(parameters, state);
    step_garden_probabilities(parameters, state);
    step_inventory_state(parameters, state);
  }

  rerender_inventory(parameters, state, render);
  rerender_garden(parameters, state, render);
}


function populated_garden_cell_action(cell, parameters, state, render)
{
  if (
    state.action.remaining > 0 &&
    state.action.type == ACTION_TYPE_NONE
  ) {
    // pick up the cell.
    // change the action type.
    // update the action count.
    let [i,j] = cell.index;
    state.action.type = ACTION_TYPE_CARRYING_GARDEN_CELL;
    state.garden.cells[i][j] = empty_garden_cell(cell.index, parameters, state);
    state.action.cell = cell;

    // render cursor
  }

  if (state.action.remaining < 1)
  {
    step_garden_state(parameters, state);
    step_garden_probabilities(parameters, state);
    step_inventory_state(parameters, state);
  }

  rerender_inventory(parameters, state, render);
  rerender_garden(parameters, state, render);
}


function empty_inventory_cell_action(cell, parameters, state, render)
{
  if (
    state.action.remaining >= 1 &&
    state.action.type == ACTION_TYPE_CARRYING_GARDEN_CELL
  ) {
    // console.log(state.action.cell);
    let entity_function = sample_to_inventory_cell(CELL_INDICES[state.action.cell.type]);
    state.inventory.cells[cell.index] = entity_function(cell.index, parameters, state);
    state.inventory.cells[cell.index].entity = state.action.cell.entity;
    state.action.type = ACTION_TYPE_NONE;
    state.action.remaining -= 1;
    state.action.cell = {};
  }

  if (state.action.remaining < 1)
  {
    step_garden_state(parameters, state);
    step_garden_probabilities(parameters, state);
    step_inventory_state(parameters, state)
  }

  rerender_inventory(parameters, state, render);
  rerender_garden(parameters, state, render);
}


function populated_inventory_cell_action(cell, parameters, state, render)
{
  if (
    state.action.remaining >= 1 &&
    state.action.type == ACTION_TYPE_NONE &&
    typeof cell.entity.successor_type != "undefined"
  ) {
    let entity_function = sample_to_inventory_cell(CELL_INDICES[cell.entity.successor_type]);
    state.inventory.cells[cell.index] = entity_function(cell.index, parameters, state);
    state.action.type = ACTION_TYPE_NONE;
    state.action.remaining -= 1;
    state.action.cell = {};
  }

  if (
    state.action.remaining >= 1 &&
    state.action.type == ACTION_TYPE_NONE &&
    typeof cell.entity.successor_type == "undefined"
  ) {
    // place a immediate update the grid.

    state.inventory.cells[cell.index] = empty_inventory_cell(cell.index, parameters, state);
    state.action.cell = cell;
    state.action.type = ACTION_TYPE_CARRYING_INVENTORY_CELL;

    // console.log(state.action.cell);
    // let entity_function = sample_to_inventory_cell(CELL_INDICES[state.action.cell.type]);
    // state.inventory.cells[cell.index] = entity_function(cell.index, parameters, state);
    // state.inventory.cells[cell.index].entity = state.action.cell.entity;
    // state.action.type = ACTION_TYPE_NONE;
    // state.action.remaining -= 1;
    // state.action.cell = {};
  }

  if (state.action.remaining < 1)
  {
    step_garden_state(parameters, state);
    step_garden_probabilities(parameters, state);
    step_inventory_state(parameters, state)
  }

  rerender_inventory(parameters, state, render);
  rerender_garden(parameters, state, render);
}


function mount_entity(raw_data)
{
  raw_data.transitions = softmax_normalize_distribution(raw_data.transitions);
  return raw_data;
}

// Entities and Entity Functions

function empty_garden_cell(index, parameters, state)
{
  return {
    index,
    type: CELL_TYPE_EMPTY,
    age: 0,
    entity: {
      // to empty, to mushroom, to flower, to weed
      // transitions: softmax_normalize_distribution([0.96, 0.01, 0.01, 0.02]),
      transitions: [0.95, 0.01, 0.01, 0.03],
      transition_factors: [1, 1, 1, 1],
      resilience_factor: 1,

      life_span: 0,
    },
    act: empty_garden_cell_action
  };
}

function mushroom_garden_cell(index, parameters, state)
{
  return {
    index,
    type: CELL_TYPE_MUSHROOM,
    age: 0,
    entity: {
      // grow or decay?
      transitions: softmax_normalize_distribution([0.1, 0.9, 0.0, 0.0]),
      // to empty, to mushroom, to flower, to weed
      transition_factors: [0.9, 1, 1, 1],
      resilience_factor: 0.9,

      life_span: 0,
      shelf_life: 3,
      successor_type: CELL_TYPE_SPORES
    },
    act: populated_garden_cell_action
  };
}


function flower_garden_cell(index, parameters, state)
{
  return {
    index,
    type: CELL_TYPE_FLOWER,
    age: 0,
    entity: {
      // grow or stay the same?
      transitions: softmax_normalize_distribution([0.05, 0.0, 0.98, 0.0]),
      // to empty, to mushroom, to flower, to weed
      transition_factors: [1, 1, 1.2, 0.8],
      resilience_factor: 1.1,

      life_span: 1,
      shelf_life: 4,

      successor_type: CELL_TYPE_SEEDS
    },
    act: populated_garden_cell_action
  };
}


function weed_garden_cell(index, parameters, state)
{
  return {
    index,
    type: CELL_TYPE_WEED,
    age: 0,
    entity: {
      // grow or stay the same?
      transitions: softmax_normalize_distribution([0.01, 0.00, 0.0, 0.99]),
      // to empty, to mushroom, to flower, to weed
      transition_factors: [1, 0.8, 0.6, 1.1],
      resilience_factor: 0.9,

      life_span: 1,
      shelf_life: 3,
      successor_type: CELL_TYPE_COMPOST
    },
    act: populated_garden_cell_action
  }
}

function seeds_garden_cell(index, parameters, state)
{
  return {
    index,
    type: CELL_TYPE_SEEDS,
    age: 0,
    entity: {},
    act: populated_garden_cell_action
  }
}

function spores_garden_cell(index, parameters, state)
{
  return {
    index,
    type: CELL_TYPE_SPORES,
    age: 0,
    entity: {},
    act: populated_garden_cell_action
  }
}

function compost_garden_cell(index, parameters, state)
{
  return {
    index,
    type: CELL_TYPE_COMPOST,
    age: 0,
    entity: {},
    act: populated_garden_cell_action
  }
}


function empty_inventory_cell(index, parameters, state)
{
  return {
    index,
    type: CELL_TYPE_EMPTY,
    entity: {},
    act: empty_inventory_cell_action
  };
}

function mushroom_inventory_cell(index, parameters, state)
{
  return {
    index,
    type: CELL_TYPE_MUSHROOM,
    entity: {},
    act: populated_inventory_cell_action
  };
}


function flower_inventory_cell(index, parameters, state)
{
  return {
    index,
    type: CELL_TYPE_FLOWER,
    entity: {},
    act: populated_inventory_cell_action
  };
}


function weed_inventory_cell(index, parameters, state)
{
  return {
    index,
    type: CELL_TYPE_WEED,
    entity: {},
    act: populated_inventory_cell_action
  };
}

function seeds_inventory_cell(index, parameters, state)
{
  return {
    index,
    type: CELL_TYPE_SEEDS,
    entity: {
      transitions: softmax_normalize_distribution([1.0, 0, 0, 0]),
      transition_factors: [0.5, 1, 10, 1],
      resilience_factor: 0,
      life_span: 1,
      shelf_life: 10
    },
    act: populated_inventory_cell_action
  };
}

function spores_inventory_cell(index, parameters, state)
{
  return {
    index,
    type: CELL_TYPE_SPORES,
    entity: {
      transitions: softmax_normalize_distribution([1.0, 0, 0, 0]),
      transition_factors: [0.5, 10, 0.5, 0.5],
      resilience_factor: 0,
      life_span: 1,
      shelf_life: 3
    },
    act: populated_inventory_cell_action
  };
}

function compost_inventory_cell(index, parameters, state)
{
  return {
    index,
    type: CELL_TYPE_COMPOST,
    entity: {
      transitions: softmax_normalize_distribution([1.0, 0, 0, 0]),
      transition_factors: [1.0, 2, 2, 2],
      resilience_factor: 0,
      life_span: 1,
      shelf_life: 10
    },
    act: populated_inventory_cell_action
  };
}



// Probability and Distribution functions

function sample_from_distribution(distribution)
{
  let sample = Math.random();
  let sum = 0;
  for (let i = 0; i < distribution.length; i++)
  {
    sum += distribution[i];
    if (sample < sum) { return i; }
  }

  // no sample
  console.error("Sample Error: distribution is not normalized");
  return -1;
}

function  sample_index_uniform(parameters)
{
  let row_index = Math.floor(Math.random() * parameters.garden.cols);
  let col_index = Math.floor(Math.random() * parameters.garden.rows);

  return [row_index, col_index];
}

function softmax_normalize_distribution(distribution)
{
  let sum = distribution.reduce((a,b) => { return a + b}, 0);
  return distribution.map(a => { return a / sum; });
}


// Inventory Stuff



// State Stuff

let parameters = {
  garden: {
    rows: 7,
    cols: 7,
    // empty, mushroom, flower, weed
    // enter the rough proportions of the distribution here.
    initial_distribution: softmax_normalize_distribution([.99, 0.001, 0.002, 0.00])
  },
  inventory: {
    size: 4
  },
  action: {
    count: 1
  }
};

function create_initial_garden_cells(parameters)
{
  let [initial_i, initial_j] = sample_index_uniform(parameters);
  let cells = [];
  for (var i = 0; i < parameters.garden.rows; i++ )
  {
    cells.push([]);
    for (var j = 0; j < parameters.garden.cols; j++ )
    {
      if (i === initial_i && j === initial_j)
      {
        // sample the random initial mushroom type.
        cells[i].push(mushroom_garden_cell([i, j], parameters, state));
      }
      else
      {
        let sample = sample_from_distribution(parameters.garden.initial_distribution);
        let entity_function = sample_to_garden_cell(sample);
        // sample the random entity of this type.
        cells[i].push(entity_function([i, j], parameters, state));
      }
    }
  }

  return cells;
}

function create_initial_inventory_cells(parameters)
{
  let inventory = [];
  for (var i = 0; i < parameters.inventory.size; i++)
  {
    inventory.push(empty_inventory_cell(i, parameters));
  }

  return inventory;
}



// State Data

let state = {
  update: false,
  garden: {
    cells: create_initial_garden_cells(parameters)
  },
  inventory: {
    cells: create_initial_inventory_cells(parameters)
  },
  action: {
    remaining: parameters.action.count,
    type: ACTION_TYPE_NONE
  }
};


function step_garden_state(parameters, state)
{
  for (var i = 0; i < parameters.garden.rows; i++ )
  {
    for (var j = 0; j < parameters.garden.cols; j++ )
    {
      let cell = state.garden.cells[i][j];

      // cells are guaranteed to remain alive for a bit
      // if they have a lifespan set...
      if (cell.entity.life_span > 0)
      {
        cell.age += 1
        cell.entity.life_span -= 1
      }
      // otherwise, it's statistics
      else
      {
        let sample = sample_from_distribution(cell.entity.transitions);
        if ( CELL_TYPES[sample] === cell.type)
        {
          // we sampled our same entity state from
          // the transition distribution. We survive!
          cell.age += 1
        }
        else
        {
          // Nope, we transitioned to something else.
          // look the setter for that thing up, and transform.
          let entity_function = sample_to_garden_cell(sample);

          // sample the random entity of this type.
          // or introduce a mechanism, for setting what shows up here.
          // maybe a global distribution over new things entering the field?
          state.garden.cells[i][j] = entity_function([i, j], parameters, state);
        }
      }
    }
  }
}




function get_cell(i, j, state)
{
  if (typeof state.garden.cells[i] === 'undefined')
  {
    return undefined;
  }
  else
  {
    return state.garden.cells[i][j];
  }
}

function step_neighbors(index, state)
{
  let [i, j] = index;
  let cell_to_update = get_cell(i, j, state);
  let type = cell_to_update.type;

  for (let di = -1; di < 2; di++)
  {
    for (let dj = -1; dj < 2; dj++)
    {
      let neighbor = get_cell(i + di, j + dj, state);
      if (typeof neighbor !== "undefined" && (dj !== 0 || di !== 0))
      {
        let new_transitions = cell_to_update.entity.transitions.map((p, i) => {
          return neighbor.entity.transition_factors[i] * p;
        })

        // new_transitions[CELL_INDICES[cell_to_update.type]] *= cell_to_update.entity.resilience_factor;
        cell_to_update.entity.transitions = softmax_normalize_distribution(new_transitions);
      }
    }
  }
}

function step_garden_probabilities(parameters, state)
{
  for (var i = 0; i < parameters.garden.rows; i++ )
  {
    for (var j = 0; j < parameters.garden.cols; j++ )
    {
      step_neighbors([i, j], state);
    }
  }
}



function step_inventory_state(parameters, state)
{
  let actions = parameters.action.count;

  for (var i = 0; i < parameters.inventory.size; i++ )
  {
    let cell = state.inventory.cells[i];
    cell.entity.shelf_life -= 1;

    if (cell.entity.shelf_life == 0)
    {
      state.inventory.cells[i] = empty_inventory_cell(i, parameters, state);
    }
    else if (cell.type === CELL_TYPE_FLOWER)
    {
      actions += 1;
    }
  }


  state.action.remaining = actions;
}


function step_state(parameters, state)
{
  step_garden_state(parameters, state);
  step_garden_probabilities(parameters, state);
  step_inventory_state(parameters, state);
}



// Render Stuff

let render = {
  garden: {
    stage: null
  },
  inventory: {
    stage: null
  }
}

function render_labelled_cell(index, parameters, state, render)
{
  let [i,j] = index;
  let cell = state.garden.cells[i][j];
  return m('div',
    {
      id: `cell-r${i}-c${j}`,
      class: `cell cell-type-${cell.type}`,
      onclick: () => {
        cell.act(cell, parameters, state, render);
      }
    },
    `${cell.type} (${cell.age})`
  );
}

function render_debug_cell(index, parameters, state, render)
{
  let [i,j] = index;
  let cell = state.garden.cells[i][j];
  return m('div',
    {
      id: `cell-r${i}-c${j}`,
      class: `cell cell-type-${cell.type}`,
      onclick: () => {
        cell.act(cell, parameters, state, render);
      }
    },
    [
      m('div', {
        class: 'cell-transitions'
      }, cell.entity.transitions.map(v => {
        return m('div', {
          class: 'probability-mass',
          style: `height:${100 * v}%;margin-top:${100 - (100 * v)}%;`
        }, '');
      })),

      m('p', {
        class: 'cell-type'
      }, `${cell.type} (${cell.age})`)
    ]
  );
}

function rerender_garden(parameters, state, render)
{
  let garden_rows = [];
  for (var i = 0; i < parameters.garden.rows; i++)
  {
    let garden_row = [];
    for (var j = 0; j < parameters.garden.cols; j++)
    {
      garden_row.push(render_debug_cell([i, j], parameters, state, render));
    }
    garden_rows.push(m('div', {class: 'garden-row'}, garden_row));
  }

  let garden_node = m('div', {id: 'garden-container'}, garden_rows);
  m.render(render.garden.stage, garden_node);
}

function rerender_inventory(parameters, state, render)
{
  let inventory_rows = [];
  for (var i = 0; i < parameters.inventory.size; i++)
  {
    let cell = state.inventory.cells[i];
    let label = `${cell.type}`;
    label += (cell.type !== CELL_TYPE_EMPTY) ? ` (${cell.entity.shelf_life})` : '';

    inventory_rows.push(m('div', {
      class: `inventory-cell inventory-cell-${cell.type}`,
      onclick: () => {
        cell.act(cell, parameters, state, render);
      }
    }, label))
  }

  inventory_rows.push(m('div', {
    class: 'action-count'
  }, `${state.action.remaining}`));

  let inventory_node = m('div', {id: 'inventory-container'}, inventory_rows);
  m.render(render.inventory.stage, inventory_node);
}


function init_render_garden(parameters, state, render)
{
  render.garden.stage = document.getElementById('garden');
  rerender_garden(parameters, state, render);
}

function init_render_inventory(parameters, state, render)
{
  render.inventory.stage = document.getElementById('field-guide');
  rerender_inventory(parameters, state, render);
}


init_render_garden(parameters, state, render);
init_render_inventory(parameters, state, render);



function simulate_undisturbed_state(frametime_ms)
{
  window.setInterval(() => {
    step_state(parameters, state);
    rerender_garden(parameters, state, render);
    rerender_inventory(parameters, state, render);
  }, frametime_ms);
}

// simulate_undisturbed_state(50);
