package scripts.metabolitesVs16S;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.StringTokenizer;

import utils.Avevar;
import utils.ConfigReader;
import utils.TTest;

public class TTestsCaseVsControl
{
	public static void main(String[] args) throws Exception
	{
		String[] vals = { "fam" , "gen", "ord", "phy" , "cls", "counts" };
		
		for(String s : vals)
			runALevel(s);
		
	}
	
	public static void runALevel(String level) throws Exception
	{
		BufferedReader reader = new BufferedReader(new FileReader(new File(ConfigReader.getMetabolitesCaseControl() + 
				File.separator + "topeFeb2014_logNorm_" + level + ".txt")));
		
		List<String> taxaNames= (getTaxaNames(reader.readLine()));
		HashMap<String, Holder> taxaMap = new LinkedHashMap<String, Holder>();
		
		for( String s : taxaNames)
		{
			Holder h = new Holder();
			h.taxaName = s;
			taxaMap.put(s, h);
		}
		
		populateMap(taxaNames, taxaMap, reader);
		addPValues(taxaMap, taxaNames);
		writeResults(taxaMap, taxaNames,level);
		
		reader.close();
	}
	
	
	
	static void populateMap( List<String> taxaNames, HashMap<String, Holder> map, BufferedReader reader )
		throws Exception
	{
		for( String s= reader.readLine(); s != null; s= reader.readLine())
		{
			StringTokenizer sToken = new StringTokenizer(s, "\t");
			sToken.nextToken();
			String sample = sToken.nextToken().replaceAll("\"", "");
			System.out.println(sample);
			
			String caseControlString = sToken.nextToken().trim().replaceAll("\"", "");
			
			for( int x=0; x < taxaNames.size(); x++)
			{
				System.out.println("\t"+ taxaNames.get(x));
				HashMap<String, Double> innerMap = null;
				String taxa = taxaNames.get(x);
				Holder h = map.get(taxa);
				
				if( caseControlString.equals("case"))
				{
					innerMap = h.caseMap;
				}
				else if( caseControlString.equals("control"))
				{
					innerMap = h.controlMap;
				}
				else throw new Exception("NO " + caseControlString );
				
				if( innerMap.containsKey(sample))
					throw new Exception("duplicate sample  " + sample);
				
				innerMap.put(sample, Double.parseDouble(sToken.nextToken()));
			}
			
			if( sToken.hasMoreTokens())
				throw new Exception("No");
		}
	}
	
	static class Holder implements Comparable<Holder>
	{
		String taxaName;
		double pValue;
		HashMap<String, Double> caseMap = new HashMap<String,Double>();
		HashMap<String, Double> controlMap = new HashMap<String,Double>();
		
		@Override
		public int compareTo(Holder arg0)
		{
			return Double.compare(this.pValue, arg0.pValue);
		}
	}
	
	private static void addPValues( HashMap<String, Holder> map , List<String> taxaName)
	{
		for( String s : taxaName ) 
		{
			Holder h = map.get(s);
			List<Double> caseList = new ArrayList<Double>();
			List<Double> controlList = new ArrayList<Double>();
			
			for( String s2 : h.caseMap.keySet() )
				caseList.add(h.caseMap.get(s2));
			
			for( String s2 : h.controlMap.keySet())
				controlList.add(h.controlMap.get(s2));
			
			double pValue =1 ;
			
			try
			{
				pValue = TTest.ttestFromNumberUnequalVariance(caseList, controlList).getPValue();
			}
			catch(Exception ex)
			{
				
			}
			h.pValue = pValue;
		}
	}
	
	private static void writeResults( HashMap<String, Holder> map , List<String> taxaName, String level ) throws Exception
	{
		BufferedWriter writer = new BufferedWriter(new FileWriter(new File(ConfigReader.getMetabolitesCaseControl() +
				File.separator +  level + "TTest.txt")));
		
		List<Holder> resultsList = new ArrayList<Holder>(map.values());
		Collections.sort(resultsList);
		
		writer.write(level + "\tcaseAverage\tcontrolAverage\tcaseControlRatio\tpValue\tbhCorrectedPValue\n");
		
		int index =1;
		for( Holder h : resultsList) 
		{
			writer.write(h.taxaName + "\t");
			List<Double> caseList = new ArrayList<Double>();
			List<Double> controlList = new ArrayList<Double>();
			
			for( String s2 : h.caseMap.keySet() )
				caseList.add(h.caseMap.get(s2));
			
			for( String s2 : h.controlMap.keySet())
				controlList.add(h.controlMap.get(s2));
			
			double caseAvg = new Avevar(caseList).getAve() ;
			writer.write( caseAvg+ "\t");
			
			double controlAvg = new Avevar(controlList).getAve();
			writer.write(controlAvg+ "\t");
			
			double ratio = caseAvg / controlAvg ;
			
			if( ratio < 1)
				ratio = -1/ratio;
			
			writer.write( ratio + "\t");
			
			
				
			writer.write(h.pValue + "\t");
			writer.write(h.pValue * resultsList.size() / index + "\n");
			index++;
			
		} 
		
		writer.flush();  writer.close();
	}
	
	static List<String> getTaxaNames(String headerLine) throws Exception
	{
		List<String> list = new ArrayList<String>();
		
		StringTokenizer sToken = new StringTokenizer(headerLine, "\t");
		
		sToken.nextToken(); sToken.nextToken();
		
		while( sToken.hasMoreTokens())
			list.add(sToken.nextToken().replaceAll("\"", ""));
			
		return list;
	}
	
}
