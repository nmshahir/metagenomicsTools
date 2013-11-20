/** 
 * Author:  anthony.fodor@gmail.com
 * 
 * This code is free software; you can redistribute it and/or
* modify it under the terms of the GNU General Public License
* as published by the Free Software Foundation; either version 2
* of the License, or (at your option) any later version,
* provided that any use properly credits the author.
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU General Public License for more details at http://www.gnu.org * * */

package eTree;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.util.HashMap;
import java.util.StringTokenizer;

import parsers.FastaSequence;
import parsers.FastaSequenceOneAtATime;
import parsers.NewRDPNode;
import parsers.NewRDPParserFileLine;
import probabilisticNW.ProbNW;
import probabilisticNW.ProbSequence;
import utils.ConfigReader;
import utils.ProcessWrapper;

public class ETree
{
	public static final double[] LEVELS = {0.0, 0.5,0.4,0.35, 0.3,0.2, 0.1, 0.07, 0.05, 0.04, 0.03};
	private static int node_number =1;
	public static final int RDP_THRESHOLD = 80;
	
	private final ENode topNode;
	
	public void addSequence(String sequence, int numDereplicatedSequences) throws Exception
	{
		ProbSequence probSeq = new ProbSequence(sequence, numDereplicatedSequences);
		
		ENode index = addToOrCreateNode(topNode, probSeq);
		
		while( index != null)
			index = addToOrCreateNode(index, probSeq);
	}
	
	private int getIndex(double level) throws Exception
	{
		for( int i =0; i < LEVELS.length; i++)
			if( LEVELS[i] == level)
				return i;
		
		throw new Exception("Could not find " + level);
	}
	
	private ENode addToOrCreateNode( ENode parent , ProbSequence newSeq) throws Exception
	{
		if( parent.getDaughters().size() == 0 )
			return null;
		
		for( ENode node : parent.getDaughters() )
		{
			ProbSequence possibleAlignment= ProbNW.align(node.getProbSequence(), newSeq);
			//System.out.println( possibleAlignment.getSumDistance()  + "  " + node.getLevel()  );
			if( possibleAlignment.getSumDistance() <= node.getLevel())
			{
				node.setProbSequence(possibleAlignment);
				return node;
			}
		}
		
		// still here - no matches - add a new node
		ENode newNode = new ENode(newSeq, "Node" +node_number++,  parent.getDaughters().get(0).getLevel(), parent);
		parent.getDaughters().add(newNode);
		
		int index = getIndex(newNode.getLevel());
		
		for( int x=index +1; x < LEVELS.length; x++)
		{
			ENode previousNode =newNode;
			newNode = new ENode(newSeq, "Node" + node_number++, LEVELS[x], previousNode);
			previousNode.getDaughters().add(newNode);
		}
		
		return null;
	}
	
	public ETree(String starterSequence, int numDereplicateSequences)
	{
		ProbSequence aSeq = new ProbSequence(starterSequence, numDereplicateSequences);
		this.topNode = new ENode(aSeq, "root", LEVELS[0], null);
		ENode lastNode = topNode;
		
		for( int x=1; x < LEVELS.length; x++)
		{
			ENode nextNode = new ENode(aSeq, "Node" + node_number++ , LEVELS[x], lastNode);
			lastNode.getDaughters().add(nextNode);
			lastNode = nextNode;
		}
	}
	
	public void writeAsXML(String xmlFilePath) throws Exception
	{
		writeAsXML(new File(xmlFilePath));
	}
	
	public void writeAsXML(File xmlFile) throws Exception
	{

		HashMap<String, NewRDPParserFileLine> rdpMap =  tryForRDPMap();
			
		BufferedWriter writer = new BufferedWriter(new FileWriter(xmlFile));
		
		writer.write("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
		writer.write("<phyloxml xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.phyloxml.org http://www.phyloxml.org/1.10/phyloxml.xsd\" xmlns=\"http://www.phyloxml.org\">\n");
		writer.write("<phylogeny rooted=\"true\" rerootable=\"false\">\n");
		
		addNodeAndDaughtersToXML(this.topNode,writer,0, rdpMap);
		
		writer.write("</phylogeny>\n");
		writer.write("</phyloxml>\n");
		
		writer.flush();  writer.close();
	}
	
	public void writeUngappedConsensusSequences(String filePath) throws Exception
	{
		writeUngappedConsensusSequences(new File(filePath));
	}
	
	public void writeUngappedConsensusSequences(File outFile) throws Exception
	{
		BufferedWriter writer = new BufferedWriter(new FileWriter(outFile));
		
		for( ENode node : topNode.getDaughters() )
			writeUngappedSequenceAndSubSequences(writer, node);
			
		writer.close(); writer.close();
	}
	
	private HashMap<String, NewRDPParserFileLine> tryForRDPMap()
	{
		try
		{
			File seqFile = new File( ConfigReader.getETreeTestDir() + File.separator + "consensusSequences.txt");
			
			if( seqFile.exists())
				seqFile.delete();
			
			if( seqFile.exists())
				throw new Exception("Could not delete " + seqFile.getAbsolutePath());
			
			File rdpFile = new File(ConfigReader.getETreeTestDir() + File.separator + "rdpSeqFile.txt");
			
			if( rdpFile.exists())
				rdpFile.delete();
			
			if( rdpFile.exists())
				throw new Exception("Could not delete " + rdpFile.getAbsolutePath());
			
			writeUngappedConsensusSequences(seqFile);
			
			String[] args = new String[7];
			
			args[0] = "java";
			args[1] = "-jar";
			args[2] = ConfigReader.getRDPJarPath();
			args[3] = "-q";
			args[4] = seqFile.getAbsolutePath();
			args[5] = "-o";
			args[6] = rdpFile.getAbsolutePath();
			
			new ProcessWrapper(args);
			
			return NewRDPParserFileLine.getAsMapFromSingleThread(rdpFile.getAbsolutePath());
		}
		catch(Exception ex)
		{
			System.out.println("Could not get RDP map");
			ex.printStackTrace();
		}
		
		return null;
	}
	
	private void writeUngappedSequenceAndSubSequences( BufferedWriter writer, ENode node) throws Exception
	{
		writer.write(">" + node.getNodeName() + "\n");
		writer.write(node.getProbSequence().getConsensus().replaceAll("-", "") + "\n");
		
		for( ENode subNode : node.getDaughters() )
			writeUngappedSequenceAndSubSequences(writer, subNode);
	}
	
	private void addNodeAndDaughtersToXML( ENode node, BufferedWriter writer, int level, HashMap<String, NewRDPParserFileLine> rdpMap ) throws Exception
	{
		
		String tabString = "";
		
		for( int x=0; x <= level; x++ )
			tabString += "\t";
		
		String taxaName = "" + node.getLevel();
		String rank = null;
		String commonName = null;
		//String phylaName = null;
		
		if( rdpMap != null )
		{
			NewRDPParserFileLine line = rdpMap.get( node.getNodeName() );
			
			if( line != null)
			{
				NewRDPNode rdpNode = line.getLowestNodeAtThreshold(RDP_THRESHOLD);
				taxaName = rdpNode.getTaxaName() + " " + taxaName;
				rank = line.getLowestRankThreshold(RDP_THRESHOLD);
				commonName = tabString + "\t<common_name>" + line.getSummaryString(2)+"</common_name>\n";
				//NewRDPNode phylaNode = line.getTaxaMap().get(NewRDPParserFileLine.PHYLUM);
				
				//if( phylaNode != null)
				//	phylaName = tabString + "\t<accession>" + phylaNode.getTaxaName() + "</accession>\n";
			}
				
		}
		
		writer.write(tabString + "<clade>\n");
		
		//if( phylaName != null)
		//	writer.write(phylaName);
		writer.write( tabString + "\t<name>" + node.getNodeName() 
				+ "(" + node.getNumOfSequencesAtTip() + "seqs) level " + node.getLevel() +"</name>\n");
		
		if( level > 1 )
		{
			double branchLength = LEVELS[level-1] - LEVELS[level];
			writer.write(tabString + "\t<branch_length>" + branchLength +  "</branch_length>\n");
		}
		else
		{
			double branchLength = 0.01;
			writer.write(tabString + "\t<branch_length>" + branchLength +  "</branch_length>\n");
		}
		
		writer.write(tabString + "\t<taxonomy>");
		// obviously, just a stub at this point
		
		
		writer.write(tabString + "\t<scientific_name>" + taxaName + "(" + rank + ")" +"</scientific_name>\n");
		
		if( commonName != null)
			writer.write(commonName);
		
		if( rank != null)
			writer.write(tabString + "\t<rank>" + rank + "</rank>\n");
		
		writer.write(tabString + "\t</taxonomy>\n");
		
		level++;
		
		for( ENode daughter: node.getDaughters() )
			addNodeAndDaughtersToXML(daughter, writer, level, rdpMap);
		
		writer.write(tabString + "</clade>\n");
	}
	
	private static int getNumberOfDereplicatedSequences(FastaSequence fs) throws Exception
	{
		StringTokenizer header = new StringTokenizer(fs.getFirstTokenOfHeader(), "_");
		header.nextToken();
		header.nextToken();
		
		int returnVal = Integer.parseInt(header.nextToken());
		
		if( header.hasMoreTokens())
			throw new Exception("Parsign error");
		
		return returnVal;
	}
	
	public static void main(String[] args) throws Exception
	{
		FastaSequenceOneAtATime fsoat = 
				new FastaSequenceOneAtATime( ConfigReader.getETreeTestDir() + 
						File.separator + "gastro454DataSet" + File.separator + "DEREP_SAMP_PREFIX39D1");
		
		FastaSequence firstSeq = fsoat.getNextSequence();
		ETree eTree = new ETree(firstSeq.getSequence(), getNumberOfDereplicatedSequences(firstSeq));
		
		int x=1;
		for( FastaSequence fs = fsoat.getNextSequence(); fs != null; fs = fsoat.getNextSequence())
		{
			eTree.addSequence(fs.getSequence(), getNumberOfDereplicatedSequences(fs));
			System.out.println(++x);
		}
		
		eTree.writeAsXML(ConfigReader.getETreeTestDir() + File.separator + 
				"testXML.xml");
	}
}
