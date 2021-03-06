package mbqc.test;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.util.HashMap;

import utils.ConfigReader;

public class TestMDSMeta
{
	public static void main(String[] args) throws Exception
	{
		simpleTokenCheck();
		checkExtractions();
	}
	
	private static void checkExtractions() throws Exception
	{
		HashMap<String, String> exMap = quickExtractionMap();
		
		BufferedReader reader = new BufferedReader(new FileReader(new File(
				ConfigReader.getMbqcDir() + File.separator + 
				"dropbox" + File.separator +  "alpha-beta-div" + File.separator +  "beta-div"
						+ File.separator + "mdsOut_chuttenhowerplusMetadata.txt")));
		
		reader.readLine();
		
		for( String s= reader.readLine(); s != null; s= reader.readLine())
		{
			String[] splits = s.split("\t");
			
			String ex = exMap.get(splits[0]);
			
			if( ex == null)
				throw new Exception("No");
			
			if( ! ex.equals(splits[4]))
				throw new Exception("No " + splits[4] );
		}
		
		reader.close();
		
		System.out.println("Extraction test passed");
	}

	
	static HashMap<String, String> quickExtractionMap() throws Exception
	{
		HashMap<String, String> map = new HashMap<String, String>();
		
		BufferedReader reader = new BufferedReader(new FileReader(new File(
			ConfigReader.getMbqcDir() + File.separator + "dropbox" +
						File.separator + "raw_design_matrix.txt")));
		
		reader.readLine();
		
		for(String s= reader.readLine(); s != null; s = reader.readLine() )
		{
			String[] splits =s.split("\t");
			if( map.containsKey(splits[0]))
				throw new Exception("No");
			
			map.put(splits[0], splits[1]);
		}
		
		reader.close();
		return map;
	}
	
	private static void simpleTokenCheck() throws Exception
	{
		BufferedReader reader = new BufferedReader(new FileReader(new File(
			ConfigReader.getMbqcDir() + File.separator + 
			"dropbox" + File.separator +  "alpha-beta-div" + File.separator +  "beta-div"
					+ File.separator + "metadataForMergedSpecies.txt")));
		
		reader.readLine();
		
		for(String s= reader.readLine(); s != null; s = reader.readLine())
		{
			String[] splits = s.split("\t");
			
			if( ! splits[0].startsWith(splits[1]))
				throw new Exception("No ");
		}
		
		reader.close();
		System.out.println("Passed simple token check");
	}
}
