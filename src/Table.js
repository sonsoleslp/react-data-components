import React, { Component } from 'react';
import PropTypes from 'prop-types';

const simpleGet = key => data => data[key];
const keyGetter = keys => data => keys.map(key => data[key]);

const isEmpty = value => value == null || value === '';

const getCellValue = ({ prop, defaultContent, render }, row) =>
  // Return `defaultContent` if the value is empty.
  !isEmpty(prop) && isEmpty(row[prop])
    ? defaultContent
    : // Use the render function for the value.
      render
      ? render(row[prop], row)
      : // Otherwise just return the value.
        row[prop];

const getCellClass = ({ prop, className }, row) =>
  !isEmpty(prop) && isEmpty(row[prop])
    ? 'empty-cell'
    : typeof className == 'function' ? className(row[prop], row) : className;

function buildSortProps(col, sortBy, onSort) {
  const order = sortBy && sortBy.prop === col.prop ? sortBy.order : 'none';
  const nextOrder = order === 'ascending' ? 'descending' : 'ascending';
  const sortEvent = onSort.bind(null, { prop: col.prop, order: nextOrder });

  return {
    onClick: sortEvent,
    // Fire the sort event on enter.
    onKeyDown: e => {
      if (e.keyCode === 13) sortEvent();
    },
    // Prevents selection with mouse.
    onMouseDown: e => e.preventDefault(),
    tabIndex: 0,
    'aria-sort': order,
    'aria-label': `${col.title}: activate to sort column ${nextOrder}`,
  };
}

export default class Table extends Component {
  _headers = [];

  static propTypes = {
    keys: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.string,
    ]).isRequired,

    columns: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        prop: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        render: PropTypes.func,
        sortable: PropTypes.bool,
        defaultContent: PropTypes.string,
        width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        className: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
      }),
    ).isRequired,

    dataArray: PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    ).isRequired,

    buildRowOptions: PropTypes.func,

    sortBy: PropTypes.shape({
      prop: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      order: PropTypes.oneOf(['ascending', 'descending']),
    }),

    onSort: PropTypes.func,
    noDataLabel: PropTypes.string,
  };

  componentDidMount() {
    // If no width was specified, then set the width that the browser applied
    // initially to avoid recalculating width between pages.
    this._headers.forEach(header => {
      if (!header.style.width) {
        header.style.width = `${header.offsetWidth}px`;
      }
    });
  }

  render() {
    const {
      columns,
      keys,
      buildRowOptions,
      sortBy,
      onSort,
      dataArray,
      noDataLabel,
      ...otherProps
    } = this.props;

    const headers = columns.map((col, idx) => {
      let sortProps, order;
      // Only add sorting events if the column has a property and is sortable.
      if (onSort && col.sortable !== false && 'prop' in col) {
        sortProps = buildSortProps(col, sortBy, onSort);
        order = sortProps['aria-sort'];
      }

      return (
        <th
          ref={c => (this._headers[idx] = c)}
          key={idx}
          style={{ width: col.width }}
          role="columnheader"
          scope="col"
          {...sortProps}
        >
          <span>{col.title}</span>
          {!order ? null : (
            <span className="" aria-hidden="true">
              {order && order == 'ascending'
                ? asc
                : order && order == 'descending' ? desc : ''}
            </span>
          )}
        </th>
      );
    });

    const getKeys = Array.isArray(keys) ? keyGetter(keys) : simpleGet(keys);
    const rows = dataArray.map((row, key) => {
      const trProps = buildRowOptions ? buildRowOptions(row) : {};

      return (
        <tr key={'row_' + key} {...trProps}>
          {columns.map((col, i) => (
            <td key={'col-' + i} className={getCellClass(col, row)}>
              {getCellValue(col, row)}
            </td>
          ))}
        </tr>
      );
    });

    return (
      <table {...otherProps}>
        {!sortBy ? null : (
          <caption className="sr-only" role="alert" aria-live="polite">
            {`Sorted by ${sortBy.prop}: ${sortBy.order} order`}
          </caption>
        )}
        <thead>
          <tr key="headers">{headers}</tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows
          ) : (
            <tr key="no-data">
              <td colSpan={columns.length} className="text-center">
                {this.props.noDataLabel}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  }
}
let asc = (
  <svg
    width="10"
    height="10"
    viewBox="0 0 1792 1792"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M1408 1216q0 26-19 45t-45 19h-896q-26 0-45-19t-19-45 19-45l448-448q19-19 45-19t45 19l448 448q19 19 19 45z" />
  </svg>
);
let desc = (
  <svg
    width="10"
    height="10"
    viewBox="0 0 1792 1792"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M1408 704q0 26-19 45l-448 448q-19 19-45 19t-45-19l-448-448q-19-19-19-45t19-45 45-19h896q26 0 45 19t19 45z" />
  </svg>
);
