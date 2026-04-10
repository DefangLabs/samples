module Worker.JobProcessor
    ( processJobs
    , reportHealth
    ) where

import Worker.Config (Config(..))
import Worker.ScyllaClient (ScyllaConn, fetchPendingJobs, markJobComplete, insertHealthCheck)

processJobs :: ScyllaConn -> Config -> IO ()
processJobs conn config = do
    jobs <- fetchPendingJobs conn
    mapM_ (processJob conn) jobs
    putStrLn $ workerName config ++ ": processed " ++ show (length jobs) ++ " jobs"

processJob :: ScyllaConn -> (String, String) -> IO ()
processJob conn (jobId, payload) = do
    putStrLn $ "Processing job: " ++ jobId
    -- Simulate work
    markJobComplete conn jobId

reportHealth :: ScyllaConn -> Config -> IO ()
reportHealth conn config = do
    insertHealthCheck conn (workerName config)
