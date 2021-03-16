require('./main.css');
import m from 'mithril';

const CELL_TYPE_EMPTY = 'empty';
const CELL_TYPE_MUSHROOM = 'shroom';
const CELL_TYPE_FLOWER = 'flower';
const CELL_TYPE_WEED = 'weed';
const CELL_TYPES = [CELL_TYPE_EMPTY, CELL_TYPE_MUSHROOM, CELL_TYPE_FLOWER, CELL_TYPE_WEED];


const ACTION_TYPE_NONE = 'none';


// Entities and Entity Functions

function empty_cell(index, parameters, state)
{
  return {
    index,
    type: CELL_TYPE_EMPTY,
    age: 0,
    entity: {
      // to empty, to mushroom, to flower, to weed
      transitions: softmax_normalize_distribution([5, 0.1, 0.1, 0.1]),
      transition_factors: [1, 1, 1, 1],
      growth: 0
    },
    act: (cell, parameters, state, render) => {
      console.log(cell)
    }
  }
}

function mushroom_cell(index, parameters, state)
{
  return {
    index,
    type: CELL_TYPE_MUSHROOM,
    age: 0,
    entity: {
      // grow or decay?
      transitions: softmax_normalize_distribution([5, 5]),
      // to empty, to mushroom, to flower, to weed
      transition_factors: [1, 1, 1, 1],
    },
    act: (cell, parameters, state, render) => {
      console.log(cell)
    }
  }
}


function flower_cell(index, parameters, state)
{
  return {
    index,
    type: CELL_TYPE_FLOWER,
    age: 0,
    entity: {
      // grow or stay the same?
      transitions: softmax_normalize_distribution([5, 1]),
      // to empty, to mushroom, to flower, to weed
      transition_factors: [1, 1, 1.1, 1.1],
    },
    act: (cell, parameters, state, render) => {
      console.log(cell)
    }
  }
}


function weed_cell(index, parameters, state)
{
  return {
    index,
    type: CELL_TYPE_WEED,
    age: 0,
    entity: {
      // grow or stay the same?
      transitions: [0.98, 0.2],
      // to empty, to mushroom, to flower, to weed
      transition_factors: [1, 0.8, 0.8, 1.5],
    },
    act: (cell, parameters, state, render) => {
      console.log(cell)
    }
  }
}

function get_entity_function_from_type_index(type_index)
{
  return [empty_cell, mushroom_cell, flower_cell, weed_cell][type_index];
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
  let sum = distribution.reduce((a,b) => { return a + Math.exp(b)}, 0);
  return distribution.map(a => { return Math.exp(a) / sum; });
}



// State Stuff

let parameters = {
  garden: {
    rows: 6,
    cols: 6,
    // empty, mushroom, flower, weed
    // enter the rough proportions of the distribution here.
    initial_distribution: softmax_normalize_distribution([7, 2, 2, 2])
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
        cells[i].push(mushroom_cell([i, j], parameters, state));
      }
      else
      {
        let sample = sample_from_distribution(parameters.garden.initial_distribution);
        let entity_function = get_entity_function_from_type_index(sample);
        // sample the random entity of this type.
        cells[i].push(entity_function([i, j], parameters, state));
      }
    }
  }

  return cells;
}



// State Data

let state = {
  garden: {
    cells: create_initial_garden_cells(parameters)
  },
  action: {
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

      // Handle Empty Cell Update
      if (cell.type === CELL_TYPE_EMPTY)
      {
        let sample = sample_from_distribution(cell.entity.transitions);
        if ( CELL_TYPES[sample] === CELL_TYPE_EMPTY)
        {
          cell.age += 1
        }
        else
        {
          let entity_function = get_entity_function_from_type_index(sample);
          // sample the random entity of this type.
          state.garden.cells[i][j] = entity_function([i, j], parameters, state);
        }
      }

      // Handle Mushroom Cell Update
      else if (cell.type === CELL_TYPE_MUSHROOM)
      {
        let sample = sample_from_distribution(cell.entity.transitions);
        if (sample == 0)
        {
          // mushroom survives
          cell.age += 1;
        }
        else
        {
          // mushroom decays
          state.garden.cells[i][j] = empty_cell([i, j], parameters, state);
        }
      }


      else if (cell.type === CELL_TYPE_FLOWER)
      {
        let sample = sample_from_distribution(cell.entity.transitions);
        if (sample == 0)
        {
          // mushroom survives
          cell.age += 1;
        }
        else
        {
          // mushroom decays
          state.garden.cells[i][j] = empty_cell([i, j], parameters, state);
        }
      }
      else if (cell.type === CELL_TYPE_WEED)
      {
        let sample = sample_from_distribution(cell.entity.transitions);
        if (sample == 0)
        {
          // mushroom survives
          cell.age += 1;
        }
        else
        {
          // mushroom decays
          state.garden.cells[i][j] = empty_cell([i, j], parameters, state);
        }
      }
      else
      {
        console.error('StateError: Unknown Entity Type in "step_garden_state"');
      }
    }
  }
}



// Render Stuff

let render = {
  garden: {
    stage: null,
    dom: []
  }
}

function init_render_garden(parameters, state, render)
{
  render.garden.stage = document.body;
  rerender_garden(parameters, state, render);
}


function rerender_garden(parameters, state, render)
{

  let garden_rows = [];
  for (var i = 0; i < parameters.garden.rows; i++)
  {
    let garden_row = [];
    for (var j = 0; j < parameters.garden.cols; j++)
    {
      let cell = state.garden.cells[i][j];
      garden_row.push( m('div',
        {
          id: `cell-r${i}-c${j}`,
          class: `cell cell-type-${cell.type}`,
          onclick: () => {
            cell.act(cell, parameters, state, render);
          }
        },
        `${cell.type} (${cell.age})`
      ));
    }
    garden_rows.push(m('div', {class: 'garden-row'}, garden_row));
  }

  let garden_node = m('div', {id: 'garden-container'}, garden_rows);
  m.render(render.garden.stage, garden_node);
}


init_render_garden(parameters, state, render);

window.setInterval(() => {

  step_garden_state(parameters, state);
  rerender_garden(parameters, state, render);

}, 1500);

console.log(state);
console.log(render);
