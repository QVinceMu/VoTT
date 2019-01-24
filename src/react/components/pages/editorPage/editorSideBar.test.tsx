import React from "react";
import EditorSideBar, { IEditorSideBarProps } from "./editorSideBar";
import { ReactWrapper, mount } from "enzyme";
import { AutoSizer, List } from "react-virtualized";
import MockFactory from "../../../../common/mockFactory";

describe("Editor SideBar", () => {
    const onSelectAssetHanlder = jest.fn();
    const testAssets = MockFactory.createTestAssets();

    function createComponent(props: IEditorSideBarProps): ReactWrapper {
        return mount(<EditorSideBar {...props} />);
    }

    it("Component renders correctly", () => {
        const props: IEditorSideBarProps = {
            assets: testAssets,
            onAssetSelected: onSelectAssetHanlder,
        };

        const wrapper = createComponent(props);
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find(AutoSizer).exists()).toBe(true);
        expect(wrapper.find(List).exists()).toBe(true);
    });

    it("Initializes state without asset selected", () => {
        const props: IEditorSideBarProps = {
            assets: testAssets,
            onAssetSelected: onSelectAssetHanlder,
        };

        const wrapper = createComponent(props);
        expect(wrapper.state("selectedAsset")).not.toBeDefined();
    });

    it("Initializes state with asset selected", () => {
        const props: IEditorSideBarProps = {
            assets: testAssets,
            selectedAsset: testAssets[0],
            onAssetSelected: onSelectAssetHanlder,
        };

        const wrapper = createComponent(props);
        expect(wrapper.state("selectedAsset")).toEqual(props.selectedAsset);
    });

    it("Updates states after props have changed", (done) => {
        const props: IEditorSideBarProps = {
            assets: testAssets,
            selectedAsset: null,
            onAssetSelected: onSelectAssetHanlder,
        };

        const wrapper = createComponent(props);
        wrapper.setProps({
            selectedAsset: testAssets[0],
        });

        setImmediate(() => {
            expect(wrapper.state("selectedAsset")).toEqual(testAssets[0]);
            done();
        });
    });

    it("Calls onAssetSelected handler when an asset is selected", (done) => {
        const props: IEditorSideBarProps = {
            assets: testAssets,
            selectedAsset: testAssets[0],
            onAssetSelected: onSelectAssetHanlder,
        };

        const nextAsset = testAssets[1];
        const wrapper = createComponent(props);
        wrapper.setProps({
            selectedAsset: nextAsset,
        });

        setImmediate(() => {
            expect(wrapper.state()["selectedAsset"]).toEqual(nextAsset);
            done();
        });
    });
});
