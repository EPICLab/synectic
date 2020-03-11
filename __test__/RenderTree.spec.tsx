import React from 'react';
import RenderTree from '../src/components/RenderTree';
import { Metadir } from '../src/types';

describe('RenderTree', () => {
    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
    }

    const oneFoneD: Metadir = {
        id: "24",
        name: "withchildren",
        path: "withchildren",
        expanded: true,
        containsDir: ["withchildren/testdir"],
        containsFile: ["withchildren/test"]
    };
    const noChildren: Metadir = {
        id: "99",
        name: "testdir",
        path: "withchildren/testdir",
        expanded: false,
        containsDir: [],
        containsFile: []
    };
    const oneFnoD: Metadir = {
        id: "63",
        name: "withOneFile",
        path: "noFoneD/withOneFile",
        expanded: true,
        containsDir: [],
        containsFile: ["withOneFile/foo"]
    }
    const noFoneD: Metadir = {
        id: "2",
        name: "withOneDir",
        path: "withOneDir",
        expanded: true,
        containsDir: ["noFoneD/withOneFile"],
        containsFile: []
    }
    const metadirs: Metadir[] = [];
    metadirs.push(oneFoneD);
    metadirs.push(noChildren);
    metadirs.push(oneFnoD);
    metadirs.push(noFoneD);

    it('RenderTree should return a valid JSX element for an empty directory', () => {
        const component = RenderTree(noChildren, metadirs, handleClick);
        expect(component).toBeDefined();
        expect(component.key).toEqual("99");
        expect(component.props.children[0]).toHaveLength(0);
        expect(component.props.children[1]).toHaveLength(0);
        expect(component.props.label).toEqual("testdir");
        expect(component.props.nodeId).toEqual("99");
    });

    it('RenderTree should create a valid JSX element for a directory with one folder and one file', () => {
        const component = RenderTree(oneFoneD, metadirs, handleClick);
        expect(component).toBeDefined();
        expect(component.key).toEqual("24");
        expect(component.props.children[0]).toHaveLength(1);
        expect(component.props.children[1]).toHaveLength(1);
        expect(component.props.label).toEqual("withchildren");
        expect(component.props.nodeId).toEqual("24");
    });

    it('RenderTree should create a valid JSX element for a directory with one file', () => {
        const component = RenderTree(oneFnoD, metadirs, handleClick);
        expect(component).toBeDefined();
        expect(component.key).toEqual("63");
        expect(component.props.children[0]).toHaveLength(0);
        expect(component.props.children[1]).toHaveLength(1);
        expect(component.props.label).toEqual("withOneFile");
        expect(component.props.nodeId).toEqual("63");
    });

    it('RenderTree should create a valid JSX element for a directory with one directory', () => {
        const component = RenderTree(noFoneD, metadirs, handleClick);
        expect(component).toBeDefined();
        expect(component.key).toEqual("2");
        expect(component.props.children[1]).toHaveLength(0);
        expect(component.props.children[0]).toHaveLength(1);
        expect(component.props.label).toEqual("withOneDir");
        expect(component.props.nodeId).toEqual("2");
    });
});