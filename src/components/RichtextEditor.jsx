import React from 'react';
import {
    MDXEditor,
    UndoRedo,
    BoldItalicUnderlineToggles,
    toolbarPlugin,
    listsPlugin,
    quotePlugin,
    headingsPlugin,
    linkPlugin,
    linkDialogPlugin,
    imagePlugin,

    tablePlugin,
    thematicBreakPlugin,
    frontmatterPlugin,
    BlockTypeSelect,
    CreateLink,
    InsertImage,
    InsertTable,
    InsertThematicBreak,
    ListsToggle,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

const RichtextEditor = ({ markdown, onChange }) => {
    return (
        <div className="richtext-editor border-1 p-4 rounded-md border-gray-300 shadow-sm ">
            <MDXEditor
                markdown={markdown}
                onChange={onChange}
                plugins={[
                    toolbarPlugin({
                        toolbarContents: () => (
                            <>
                                <UndoRedo />
                                <BoldItalicUnderlineToggles />
                                <CreateLink />
                                <InsertTable />
                                {/* <ListsToggle /> */}
                                <InsertThematicBreak />
                            </>
                        )
                    }),
                    listsPlugin(),
                    quotePlugin(),
                    headingsPlugin(),
                    linkPlugin(),
                    linkDialogPlugin(),
                    imagePlugin(),
                    tablePlugin(),
                    thematicBreakPlugin(),
                    frontmatterPlugin()
                ]}
            />
        </div>
    );
};

export default RichtextEditor;
