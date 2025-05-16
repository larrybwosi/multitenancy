import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import Markdown from 'markdown-to-jsx'; // Or use react-markdown with custom renderers

// --- Optional: Register Fonts ---

Font.register({
  family: 'Open Sans',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf', fontWeight: 600 },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf', fontWeight: 'bold' }
  ]
});
Font.register({
  family: 'RobotoMono', // For code blocks
  src: 'https://cdnjs.cloudflare.com/ajax/libs/firacode/6.2.0/raw/FiraCode-Regular.ttf'
});

// --- Styles for PDF Elements ---
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
    paddingVertical: 30,
    fontFamily: 'Open Sans',
    fontSize: 10,
    lineHeight: 1.4,
  },
  h1: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Open Sans',
    marginBottom: 18,
    color: '#1a237e', // Dark blue for main headings
  },
  h2: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Open Sans',
    marginBottom: 14,
    marginTop: 10,
    color: '#283593', // Slightly lighter blue
  },
  h3: {
    fontSize: 15,
    fontWeight: 'bold', // react-pdf uses numbers for fontWeight too, e.g., 600
    fontFamily: 'Open Sans',
    marginBottom: 10,
    marginTop: 8,
    color: '#3949ab',
  },
  p: {
    fontSize: 10,
    marginBottom: 8,
    textAlign: 'justify',
  },
  strong: {
    fontWeight: 'bold',
    fontFamily: 'Open Sans',
  },
  em: {
    fontStyle: 'italic',
    fontFamily: 'Open Sans',
  },
  ul: {
    marginBottom: 8,
    paddingLeft: 15, // Indent list
  },
  liContainer: {
    // Container for bullet + text
    flexDirection: 'row',
    marginBottom: 4,
  },
  liBullet: {
    width: 10, // Space for bullet
    marginRight: 5,
    fontFamily: 'Open Sans', // Ensure bullet font matches
  },
  liText: {
    flex: 1, // Text takes remaining space
    fontFamily: 'Open Sans',
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 0.5,
    borderColor: '#cccccc',
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 10,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
    borderStyle: 'solid',
    borderBottomWidth: 0.5,
    borderColor: '#cccccc',
  },
  tableColHeader: {
    // width is set dynamically in the component
    borderStyle: 'solid',
    borderRightWidth: 0.5,
    borderColor: '#cccccc',
    backgroundColor: '#f2f2f2', // Light grey for header background
    padding: 5,
    justifyContent: 'center', // Center content vertically
  },
  tableCol: {
    // width is set dynamically in the component
    borderStyle: 'solid',
    borderRightWidth: 0.5,
    borderColor: '#cccccc',
    padding: 5,
    justifyContent: 'center',
  },
  tableCellHeader: {
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'Open Sans',
    textAlign: 'center',
  },
  tableCell: {
    fontSize: 9,
    textAlign: 'left', // Default left align for data cells
  },
  code: {
    // Inline code
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 3,
    paddingVertical: 1,
    fontSize: 9,
    fontFamily: 'RobotoMono', // Monospaced font
    color: '#333',
  },
  pre: {
    // Code block
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginBottom: 10,
    fontSize: 9,
    fontFamily: 'RobotoMono',
    // react-pdf Text doesn't preserve whitespace like HTML <pre> by default
    // You might need to split lines and render them individually or use a trick if exact formatting is key.
    // For simplicity here, it will render as a single text block.
  },
  // Add more styles as needed: blockquote, hr, etc.
});

// Helper to determine table column widths (basic implementation)
// Tries to give more space to columns with more content in the header.
const getDynamicColumnWidths = headerCellsArray => {
  if (!headerCellsArray || headerCellsArray.length === 0) return [];

  const totalChars = headerCellsArray.reduce((sum, cell) => {
    const textContent = cell.props && cell.props.children ? String(cell.props.children) : '';
    return sum + textContent.length;
  }, 0);

  if (totalChars === 0) {
    // Fallback to equal widths if no text content
    return headerCellsArray.map(() => `${100 / headerCellsArray.length}%`);
  }

  return headerCellsArray.map(cell => {
    const textContent = cell.props && cell.props.children ? String(cell.props.children) : '';
    const proportion = textContent.length / totalChars;
    // Ensure a minimum width (e.g., 10%) and allow it to grow
    // This is a heuristic and might need tweaking
    const widthPercentage = Math.max(10, proportion * 100);
    return `${widthPercentage}%`;
  });
};

/**
 * A reusable React component to render a Markdown string into a PDF document
 * using @react-pdf/renderer and markdown-to-jsx.
 *
 * @param {object} props - The component's props.
 * @param {string} props.markdownString - The Markdown content to render.
 * @param {string} [props.documentTitle="Document"] - The title of the PDF document.
 * @returns {JSX.Element} A @react-pdf/renderer Document component.
 */
const MarkdownToPdfDocument = ({ markdownString, documentTitle = 'Document' }) => {
  // markdown-to-jsx options with overrides for PDF rendering
  const markdownOptions = {
    forceBlock: true, // Ensures elements like <p> are treated as blocks
    overrides: {
      h1: { component: Text, props: { style: styles.h1, TBreak: true } }, // break: true to suggest page break before if needed
      h2: { component: Text, props: { style: styles.h2, TBreak: true } },
      h3: { component: Text, props: { style: styles.h3, TBreak: true } },
      // Add h4, h5, h6 if needed
      p: { component: Text, props: { style: styles.p } },
      strong: { component: Text, props: { style: styles.strong } },
      b: { component: Text, props: { style: styles.strong } }, // alias for bold
      em: { component: Text, props: { style: styles.em } },
      i: { component: Text, props: { style: styles.em } }, // alias for italic
      ul: { component: View, props: { style: styles.ul } },
      li: {
        component: ({ children, ...props }) => (
          <View {...props} style={styles.liContainer}>
            <Text style={styles.liBullet}>•</Text>
            <Text style={styles.liText}>{children}</Text>
          </View>
        ),
      },
      table: {
        component: ({ children, ...props }) => {
          // children[0] is thead, children[1] is tbody
          let headerRow = null;
          if (children && children[0] && children[0].props && children[0].props.children) {
            headerRow = children[0].props.children; // This is the <tr> inside <thead>
          }

          let headerCellsArray = [];
          if (headerRow && headerRow.props && headerRow.props.children) {
            headerCellsArray = React.Children.toArray(headerRow.props.children); // These are the <th>
          }
          const columnWidths = getDynamicColumnWidths(headerCellsArray);

          // Pass columnWidths down to rows/cells via context or cloneElement
          const childrenWithProps = React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              // child is thead or tbody
              return React.cloneElement(child, {
                // Pass columnWidths to thead and tbody
                children: React.Children.map(child.props.children, trElement => {
                  if (React.isValidElement(trElement)) {
                    // trElement is <tr>
                    return React.cloneElement(trElement, { columnWidths });
                  }
                  return trElement;
                }),
              });
            }
            return child;
          });
          return (
            <View {...props} style={styles.table}>
              {childrenWithProps}
            </View>
          );
        },
      },
      thead: { component: View }, // Thead and Tbody are just organizational for markdown-to-jsx
      tbody: { component: View },
      tr: {
        component: ({ children, columnWidths, ...props }) => (
          <View {...props} style={styles.tableRow}>
            {React.Children.map(children, (cell, index) => {
              if (React.isValidElement(cell)) {
                return React.cloneElement(cell, {
                  style: {
                    // Combine existing cell style with dynamic width
                    ...(cell.props.style || {}),
                    width:
                      columnWidths && columnWidths[index]
                        ? columnWidths[index]
                        : `${100 / React.Children.count(children)}%`,
                  },
                });
              }
              return cell;
            })}
          </View>
        ),
      },
      th: {
        component: ({ children, ...props }) => (
          <View {...props} style={{ ...styles.tableColHeader, ...props.style }}>
            <Text style={styles.tableCellHeader}>{children}</Text>
          </View>
        ),
      },
      td: {
        component: ({ children, ...props }) => (
          <View {...props} style={{ ...styles.tableCol, ...props.style }}>
            <Text style={styles.tableCell}>{children}</Text>
          </View>
        ),
      },
      code: {
        // Inline code
        component: Text,
        props: { style: styles.code },
      },
      pre: {
        // Code block
        component: ({ children }) => {
          // markdown-to-jsx often wraps code inside pre.
          // We want to style the pre block and its text content.
          let textContent = children;
          if (children && children.props && children.props.mdxType === 'code') {
            textContent = children.props.children;
          }
          return (
            <View style={styles.pre}>
              <Text>{textContent}</Text>
            </View>
          );
        },
      },
      // --- Clean up the input markdown string for ```markdown wrapper ---
      // This override specifically targets the 'code' elements that result from ``` blocks
      // when the language is 'markdown'.
      // Note: This assumes the outer ```markdown ... ``` is parsed as a 'code' block.
      // If the entire input is just the content *inside* ```markdown ... ```, this is not needed.
      // This is a bit of a heuristic. A better approach is to pre-process the markdownString
      // to remove the ```markdown fences before passing to the Markdown component.
      // 'markdown': { // If markdown-to-jsx creates a 'markdown' element type for ```markdown
      //   component: ({ children }) => <View>{children}</View>, // Effectively unwraps it
      // },
    },
  };

  // Pre-process the markdownString to remove the ```markdown ... ``` fences
  let contentToRender = markdownString;
  if (contentToRender.startsWith('```markdown\n')) {
    contentToRender = contentToRender.substring('```markdown\n'.length);
  }
  if (contentToRender.endsWith('\n```')) {
    contentToRender = contentToRender.substring(0, contentToRender.length - '\n```'.length);
  }

  return (
    <Document title={documentTitle}>
      <Page size="A4" style={styles.page} wrap>
        {/* The `wrap` prop helps in flowing content to new pages automatically */}
        <Markdown options={markdownOptions}>{contentToRender}</Markdown>
      </Page>
    </Document>
  );
};

export default MarkdownToPdfDocument