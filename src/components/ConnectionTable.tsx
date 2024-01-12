import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import cx from 'clsx';
import { formatDistanceToNow, formatDuration } from 'date-fns';
import React, { useMemo } from 'react';
import { ChevronDown } from 'react-feather';

import prettyBytes from '../misc/pretty-bytes';
import s from './ConnectionTable.module.scss';
import { MutableConnRefCtx } from './conns/ConnCtx';

const fullColumns = [
  { header: 'Id', accessorKey: 'id' },
  { header: 'Host', accessorKey: 'host' },
  // { header: 'Process', accessorKey: 'process' },
  {
    header: 'DL',
    accessorKey: 'download',
    cell: (info: any) => prettyBytes(info.getValue()),
  },
  {
    header: 'UL',
    accessorKey: 'upload',
    cell: (info: any) => prettyBytes(info.getValue()),
  },
  {
    header: 'DL Speed',
    accessorKey: 'downloadSpeedCurr',
    cell: (info: any) => prettyBytes(info.getValue()) + '/s',
  },
  {
    header: 'UL Speed',
    accessorKey: 'uploadSpeedCurr',
    cell: (info: any) => prettyBytes(info.getValue()) + '/s',
  },
  { header: 'Chains', accessorKey: 'chains' },
  { header: 'Rule', accessorKey: 'rule' },
  {
    header: 'Time',
    accessorKey: 'start',
    cell: (info: any) => {
      const ret = formatDistanceToNow(info.getValue());
      // console.log(info.getValue(), ret);
      return ret;
    },
  },
  { header: 'Source', accessorKey: 'source' },
  { header: 'Destination IP', accessorKey: 'destinationIP' },
  { header: 'Type', accessorKey: 'type' },
  { header: 'DnsMode', accessorKey: 'dnsMode' },
];

const extraColumns = {
  header: 'Duration',
  accessorKey: 'duration',
  cell: (info: any) => {
    const ret = formatDuration({ seconds: +(Math.max(0, info.getValue()) / 1000).toFixed(0) });
    // console.log(info.getValue(), ret);
    return ret;
  },
};

const COLUMN_SORT = [{ id: 'start', desc: true }];

function Table({ data, closed }: { data: any; closed?: boolean }) {
  const connCtx = React.useContext(MutableConnRefCtx);
  const [sorting, setSorting] = React.useState<SortingState>(COLUMN_SORT);

  const columns = useMemo(
    () =>
      closed
        ? (() => {
            const tmp = [...fullColumns];
            tmp.splice(9, 0, extraColumns);
            return tmp;
          })()
        : fullColumns,
    [closed],
  );
  const columnsWithoutProcess = columns.filter((item) => item.accessorKey !== 'process');

  const table = useReactTable({
    columns: connCtx.hasProcessPath ? columns : columnsWithoutProcess,
    data,
    state: {
      sorting,
      columnVisibility: { id: false },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <table className={s.table}>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => {
          return (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th
                    key={header.id}
                    className={header.column.getCanSort() ? cx(s.th, s.pointer) : s.th}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <span className={s.thWrap}>
                      <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                      {header.column.getIsSorted() ? (
                        <span
                          className={
                            header.column.getIsSorted() === 'desc'
                              ? s.sortIconContainer
                              : cx(s.rotate180, s.sortIconContainer)
                          }
                        >
                          <ChevronDown size={16} />
                        </span>
                      ) : null}
                    </span>
                  </th>
                );
              })}
            </tr>
          );
        })}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => {
          return (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => {
                return (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default Table;
