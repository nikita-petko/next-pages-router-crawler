import { FormControl, FormHelperText, InputLabel, makeStyles } from '@rbx/ui';
import DOMPurify from 'dompurify';
import React, {
  ClipboardEvent,
  FunctionComponent,
  useLayoutEffect,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ParsedContentUrl } from '../../helpers/parseContentUrl';

interface MultiLinkFieldProps {
  value?: string[];
  helperText?: string | null;
  persistentText?: string | null;
  onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- this onchange by default typed for scalar value but is handling lists
  onChange: (value: any) => void;
  parseResults: ParsedContentUrl[] | null;
  disabled: boolean;
  variant?: 'filled' | 'outlined' | 'standard';
  error: boolean;
  required: boolean;
  color?: 'error' | 'primary' | 'secondary' | 'info' | 'success' | 'warning';
  label: string;
  limit: number;
}

const useStyles = makeStyles()((theme) => ({
  border: {
    borderRadius: '4px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: theme.palette.mode === 'dark' ? '#757575' : theme.palette.components.divider,
    minHeight: '98px',
    maxHeight: '722px',
    overflowY: 'auto',
    marginBottom: 0,
    '&:hover': {
      borderColor: theme.palette.actionV2.primary.fill,
    },
    '&:focus-visible': {
      outlineColor: theme.palette.actionV2.primaryBrand.fill,
    },
  },
  borderError: {
    borderColor: theme.palette.content.alert.important,
    '&:focus-visible': {
      outlineColor: theme.palette.content.alert.important,
    },
    '&:hover': {
      borderColor: theme.palette.content.alert.important,
    },
  },
  listItem: {
    borderLeftWidth: '1px',
    borderLeftStyle: 'solid',
    borderLeftColor: theme.palette.mode === 'dark' ? '#757575' : theme.palette.components.divider,
    paddingLeft: '10px',
    ...theme.typography.body1,
    '&::marker': {
      color: theme.palette.content.standard,
      ...theme.typography.body1,
    },
  },
  listItemError: {
    backgroundColor: theme.palette.components.alert.importantFill,
    '&::marker': {
      backgroundColor: theme.palette.components.alert.importantFill,
    },
  },
}));

const MultiLinkField: FunctionComponent<React.PropsWithChildren<MultiLinkFieldProps>> = ({
  onBlur,
  onChange,
  value,
  helperText,
  persistentText,
  parseResults,
  label,
  disabled,
  variant = 'outlined',
  error,
  required,
  color = 'primary',
  limit,
}) => {
  const olRef = useRef<HTMLOListElement>(null);
  const { classes: styles, cx } = useStyles();

  // Store current edit location as column and row so we can restore edit position on re-render
  const columnRef = useRef(0);
  const rowRef = useRef(0);
  const [showHelperText, setShowHelperText] = useState(false);

  const updateCurrentRow = (node?: Node) => {
    if (!olRef.current) {
      return;
    }
    const focusNode = node || document.getSelection()?.focusNode;
    const currentRow = Array.from(olRef.current.childNodes).findIndex(
      (el) => el === focusNode || el.firstChild === focusNode,
    );
    if (currentRow > -1) rowRef.current = currentRow;
  };

  const updateCurrentColumn = () => {
    const range = document.getSelection()?.getRangeAt(0);
    if (range) columnRef.current = range.startOffset;
  };

  const resetRange = (node: ChildNode | null, offset: number) => {
    if (!node) {
      return;
    }
    try {
      const newRange = document.createRange();
      newRange.setStart(node, offset);

      const selection = document.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(newRange);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'IndexSizeError') {
        // intentionally ignoring IndexSizeError
      } else {
        throw err;
      }
    }
  };

  const onPaste = (event: ClipboardEvent) => {
    event.preventDefault();
    const plainText = event.clipboardData.getData('text/plain');
    const plainTextLines = plainText.trim().split('\n');
    const selection = window.getSelection();

    if (olRef.current && selection && selection.rangeCount > 0) {
      // Get the current list item and keep track of it for inserting and cursor placement
      let currentNode: HTMLLIElement = event.target as HTMLLIElement;

      let lastLine: number | null = null;
      plainTextLines.forEach((line, index) => {
        if (olRef.current && olRef.current?.childNodes.length >= limit) return;

        if (index === 0) {
          // A new line already has a <li> element created, so just update the text content
          currentNode.textContent += line;
        } else {
          // Create and populate new <li> element
          const newLi = document.createElement('li');
          newLi.textContent = line;
          newLi.className = styles.listItem;

          // Append the new item after currentNode and update currentNode
          currentNode?.insertAdjacentElement('afterend', newLi);
          currentNode = newLi;
        }

        lastLine = index;
      });

      // After appending the pasted lines, set the cursor at the end of last line
      if (lastLine != null) {
        // Select and focus last inserted node
        selection.getRangeAt(0).selectNodeContents(currentNode);
        currentNode.focus();

        // Update the current row and column for cursor placement
        const previousRow = rowRef.current;
        updateCurrentRow();
        columnRef.current +=
          olRef.current.children[previousRow + lastLine].textContent?.length || 0;

        // Scroll down to the last inserted node
        currentNode.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }

    const liTextContents = Array.from(event.currentTarget.children).map(
      (li) => li.textContent || '',
    );
    onChange(liTextContents);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Backspace') {
      // If the list is empty, prevent the deletion of the only empty list item
      if (
        olRef.current?.childElementCount === 1 &&
        olRef.current?.childNodes[0].textContent?.length === 0
      ) {
        event.preventDefault();
      } else if (
        rowRef.current > 0 &&
        olRef.current?.childNodes[rowRef.current].textContent?.length === 0
      ) {
        event.preventDefault();
        const prev = olRef.current?.childNodes[rowRef.current].previousSibling;

        if (!prev) return;
        olRef.current?.childNodes[rowRef.current].remove();

        rowRef.current -= 1;
        columnRef.current = prev.textContent ? Math.max(prev.textContent.length, 0) : 0;
        resetRange(prev.firstChild, columnRef.current);
      }
    } else if (event.key === 'ArrowUp') {
      if (rowRef.current > 0) {
        rowRef.current -= 1;
        columnRef.current = olRef.current?.childNodes[rowRef.current].textContent?.length || 0;
      }
    } else if (event.key === 'ArrowDown') {
      if (rowRef.current < (olRef.current?.childElementCount || 0) - 1) {
        rowRef.current += 1;
        columnRef.current = olRef.current?.childNodes[rowRef.current].textContent?.length || 0;
      }
    } else if (event.key === 'Enter') {
      if (olRef.current && olRef.current?.children.length >= limit) {
        event.preventDefault();
        return;
      }

      rowRef.current += 1;
      columnRef.current = 0;
    }
  };

  useEffect(() => {
    setShowHelperText(error);
  }, [error]);

  useLayoutEffect(() => {
    // After re-rendering we need to restore cursor position
    if (
      olRef.current === undefined ||
      columnRef.current === undefined ||
      rowRef.current === undefined ||
      rowRef.current === -1 ||
      document.activeElement !== olRef.current
    )
      return;

    const targetNode =
      olRef.current?.childNodes[rowRef.current]?.firstChild ||
      olRef.current?.childNodes[rowRef.current];
    if (!targetNode) {
      return;
    }

    resetRange(targetNode, columnRef.current);
  });

  const handleInput = (event: React.FormEvent<HTMLOListElement>) => {
    updateCurrentRow();
    updateCurrentColumn();

    const liTextContents = Array.from(event.currentTarget.children).map(
      (li) => li.textContent || '',
    );
    onChange(liTextContents);
  };

  let innerHtml = '';
  if (value) {
    innerHtml = (Array.isArray(value) ? value : [value])
      .map((line, index) => {
        const errorClass =
          parseResults && parseResults[index]?.contentId === -1 ? styles.listItemError : '';
        return `<li class="${styles.listItem} ${errorClass}">${line}</li>`;
      })
      .join('');
    innerHtml = DOMPurify.sanitize(innerHtml, { ALLOWED_TAGS: ['li'] });
  }

  const handleOnBlur = (event: React.FocusEvent<HTMLOListElement>) => {
    if (olRef.current) {
      const liTextContents = Array.from(olRef.current.children).map((li) => li.textContent || '');
      onChange(liTextContents);
    }
    setShowHelperText(error);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- We're double-casting here beacuse OLListElement isn't normal input element and we need to force-cast the FocusEvent<HTMLOlListElement> into FocusEvent<HTMLInputElement>
    onBlur(event as any as React.FocusEvent<HTMLInputElement>);
  };

  const handleOnClick = () => {
    // This prevents a rerender when selecting text
    const selection = document.getSelection();
    if (!selection?.isCollapsed) {
      return;
    }

    updateCurrentColumn();
    updateCurrentRow();
    setShowHelperText(true);
  };

  return (
    <FormControl
      disabled={disabled}
      error={error}
      required={required}
      color={color}
      variant={variant}
      fullWidth>
      {label != null && label !== '' && (
        <InputLabel htmlFor='multi-link-field' id='multi-link-field-label' shrink>
          {label}
        </InputLabel>
      )}
      <div id='multi-link-field' data-testid='multi-link-field'>
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- hacky component utilizing dangerouslySetInnerHTML */}
        <ol
          ref={olRef}
          contentEditable
          suppressContentEditableWarning
          // eslint-disable-next-line react/no-danger -- this innerHtml value is sanitized
          dangerouslySetInnerHTML={{ __html: innerHtml }}
          onPaste={onPaste}
          onKeyDown={onKeyDown}
          onBlur={handleOnBlur}
          onClick={handleOnClick}
          onInput={handleInput}
          className={cx(styles.border, {
            [styles.borderError]: error,
          })}
          aria-describedby='infringing-links-helper-text'
        />
        {showHelperText && helperText && (
          <FormHelperText id='infringing-links-helper-text'>{helperText}</FormHelperText>
        )}
        <FormHelperText id='infringing-links-persistent-text'>{persistentText}</FormHelperText>
      </div>
    </FormControl>
  );
};

export default MultiLinkField;
