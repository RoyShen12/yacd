import cx from 'clsx';
import React from 'react';

import s from './Selection.module.scss';

type SelectionProps = {
  OptionComponent?: (...args: any[]) => any;
  optionPropsList?: any[];
  selectedIndex?: number;
  onChange?: (...args: any[]) => any;
  noBorder?: boolean;
};

export const Selection2 = React.memo(function Selection2_inner({
  OptionComponent,
  optionPropsList,
  selectedIndex,
  onChange,
  noBorder,
}: SelectionProps) {
  const inputCx = cx('visually-hidden', s.input, noBorder ? s['no-border'] : '');
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };
  return (
    <fieldset className={s.fieldset}>
      {optionPropsList.map((props, idx) => {
        const checked = selectedIndex === idx;
        return (
          <label key={idx}>
            <input
              type="radio"
              checked={checked}
              name="selection"
              value={idx}
              aria-labelledby={'traffic chart type ' + idx}
              onChange={onInputChange}
              className={inputCx}
            />
            <div className={s.cnt}>
              <OptionComponent {...props} checked={checked} />
            </div>
          </label>
        );
      })}
    </fieldset>
  );
});
